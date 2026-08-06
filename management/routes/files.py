#######################################################################
#                                                                     #
#                    FILE UPLOAD & MANAGEMENT API                     #
#                                                                     #
#        Handles file uploads to Supabase Storage and stores          #
#        their metadata in the database.                              #
#                                                                     #
#        - POST   /upload                             → upload file  #
#        - GET    /                                   → list all     #
#        - GET    /{file_id}                          → get by id    #
#        - GET    /translation-request/{id}           → by request   #
#        - PUT    /{file_id}                          → update meta  #
#        - DELETE /{file_id}                          → delete file  #
#                                                                     #
#######################################################################


import os
import uuid
from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException, Depends, File, Form, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from config.supabase_config import supabase_config
from database.database import get_db
from models.file import FileUpload
from models.user import User
from enums.enums import AllowedFileTypes, UserRole
from schemas.file_upload import FileResponse, FileUpdate
from auth.dependencies import get_current_user

router = APIRouter()

BUCKET_NAME = "uploads"


# ─── Helper: extract the storage path from a Supabase public URL ────
def _storage_path_from_url(public_url: str) -> str | None:
    """
    Supabase public URLs look like:
      https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    We need the "<path>" part to call storage.remove().
    """
    try:
        parsed = urlparse(public_url)
        marker = f"/object/public/{BUCKET_NAME}/"
        idx = parsed.path.find(marker)
        if idx == -1:
            return None
        return parsed.path[idx + len(marker):]
    except Exception:
        return None


# ─── Upload a new file ──────────────────────────────────────────────
@router.post("/upload", response_model=FileResponse)
async def upload_file(
    file: UploadFile = File(...),
    uploaded_by_user_id: int = Form(...),
    related_translation_request_id: int = Form(...),
    db: Session = Depends(get_db)
):
    # extract file information
    file_name = file.filename
    file_type = file.content_type
    file_content = await file.read()
    file_size = len(file_content)

    # validate extension
    _, extension = os.path.splitext(file_name.lower())
    allowed_extensions = [ft.value for ft in AllowedFileTypes]

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type."
        )

    # generate storage path
    unique_filename = uuid.uuid4().hex
    storage_filename = f"{unique_filename}{extension}"
    storage_path = (
        f"translation_requests/"
        f"{related_translation_request_id}/"
        f"{storage_filename}"
    )

    try:
        supabase_config.storage.from_(BUCKET_NAME).upload(
            path=storage_path,
            file=file_content,
            file_options={"content-type": file_type}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}"
        )

    public_url = supabase_config.storage.from_(BUCKET_NAME).get_public_url(storage_path)

    new_file = FileUpload(
        file_name=file_name,
        file_type=file_type,
        file_size=file_size,
        file_url=str(public_url),
        uploaded_by_user_id=uploaded_by_user_id,
        related_translation_request_id=related_translation_request_id
    )

    db.add(new_file)
    db.commit()
    db.refresh(new_file)

    return new_file


# ─── List all files ─────────────────────────────────────────────────
@router.get("/", response_model=list[FileResponse])
def get_all_files(db: Session = Depends(get_db)):
    files = db.execute(select(FileUpload)).scalars().all()
    return files


# ─── Get a file by ID ───────────────────────────────────────────────
@router.get("/{file_id}", response_model=FileResponse)
def get_file_by_id(file_id: int, db: Session = Depends(get_db)):
    file_query = db.get(FileUpload, file_id)
    if not file_query:
        raise HTTPException(status_code=404, detail="File not found")
    return file_query


#delete by id 
@router.delete("/{file_id}")
def delete_file_by_id(file_id:int, db:Session = Depends(get_db)):
    file_quer = db.get(FileUpload, file_id)
    if not file_quer:
        raise HTTPException(status_code=404, detail="file already deleted")
    db.delete(file_quer)
    db.commit()
    return {"message": "File has been deleted!"}

@router.get("/translation-request/{related_translation_request_id}", response_model=list[FileResponse])
def get_file_by_trans_req(related_translation_request_id: int, db: Session = Depends(get_db)):
    file_query = select(FileUpload).where(
        FileUpload.related_translation_request_id == related_translation_request_id
    )
    results = db.scalars(file_query).all()
    if not results:
        raise HTTPException(status_code=404, detail="No files found for this translation request")
    return results


# ─── Update file metadata ───────────────────────────────────────────
@router.put("/{file_id}", response_model=FileResponse)
def update_file(
    file_id: int,
    updates: FileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file_record = db.get(FileUpload, file_id)
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    # only the uploader or an admin can update
    if current_user.role != UserRole.ADMIN and file_record.uploaded_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own files")

    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(file_record, key, value)

    db.commit()
    db.refresh(file_record)
    return file_record


# ─── Delete a file ──────────────────────────────────────────────────
@router.delete("/{file_id}")
def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes the file from Supabase Storage AND the metadata row from the DB.
    Only the uploader or an admin can delete.
    """
    file_record = db.get(FileUpload, file_id)
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    if current_user.role != UserRole.ADMIN and file_record.uploaded_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own files")

    # remove from Supabase Storage first
    storage_path = _storage_path_from_url(file_record.file_url)
    if storage_path:
        try:
            supabase_config.storage.from_(BUCKET_NAME).remove([storage_path])
        except Exception as e:
            # if storage delete fails, don't leave orphan DB rows silently — surface it
            raise HTTPException(
                status_code=500,
                detail=f"Failed to delete file from storage: {str(e)}"
            )

    # then remove from the DB
    db.delete(file_record)
    db.commit()
    return {"message": "File successfully deleted"}
