from pydantic import BaseModel
from datetime import datetime
from typing import Optional




#store the file
class FileResponse(BaseModel):
    id: int
    file_url: str
    file_name: str
    file_type: str
    file_size: int
    created_at: datetime
    uploaded_by_user_id: int
    related_translation_request_id: int
    

    class Config:
        from_attributes = True



# schema for updating file metadata
class FileUpdate(BaseModel):
    file_name: str | None = None
    related_translation_request_id: int | None = None
class TranslationRequestSummaryResponse(BaseModel):
    id: int
    learner_id: int
    learner_name: Optional[str] = None
    learner_email: Optional[str] = None
    status: str = "pending"
    created_at: datetime
    updated_at: datetime
    file_count: int

    class Config:
        from_attributes = True
