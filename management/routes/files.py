import os
import uuid
import httpx
from fastapi import APIRouter, HTTPException, Depends, File, Form, UploadFile, Response
from sqlalchemy import select
from sqlalchemy.orm import Session
from urllib.parse import quote
from config.supabase_config import supabase_config
from database.database import get_db
from models.file import FileUpload
from enums.enums import AllowedFileTypes
from schemas.file_upload import FileResponse

router = APIRouter()

BUCKET_NAME = "uploads"

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
    allowed_extensions = [
        file_type.value
        for file_type in AllowedFileTypes
    ]

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

    BUCKET_NAME = "uploads"

    try:
        supabase_config.storage.from_(BUCKET_NAME).upload(
            path=storage_path,
            file=file_content,
            file_options={
                "content-type": file_type
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}")

    public_url = (supabase_config.storage.from_(BUCKET_NAME).get_public_url(storage_path))

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


# ============================================================================
# GET FILE BY ID
# ----------------------------------------------------------------------------
# Retrieves metadata for a single uploaded file.
#
# Endpoint:
# GET /files/{file_id}
# ============================================================================


@router.get("/{file_id}", response_model=FileResponse)
def get_file_by_id(file_id:int, db:Session = Depends(get_db)):
    file_query = db.get(FileUpload,file_id)
    if not file_query:
        raise HTTPException(status_code=404, detail="unable to retrieve id")
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
def get_file_by_trans_req(related_translation_request_id: int, db:Session = Depends(get_db)):
      file_query = select(FileUpload).where(FileUpload.related_translation_request_id == related_translation_request_id)
      results =  db.scalars(file_query).all()
      if not results:
        raise HTTPException(status_code=404, detail="unable to retrieve id")
      return results
