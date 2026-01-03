from typing import List, Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.deps import get_current_user, require_roles
from app.models.user import Role
from app.models.subject import Subject

router = APIRouter(prefix="/subjects", tags=["subjects"])


class SubjectCreate(BaseModel):
    name: str
    code: Optional[str] = None


class SubjectUpdateTeachers(BaseModel):
    teacher_ids: List[PydanticObjectId]


@router.post("", response_model=Subject)
async def create_subject(payload: SubjectCreate, _=Depends(require_roles(Role.admin))):
    existing = await Subject.find_one({"name": payload.name})
    if existing:
        raise HTTPException(status_code=400, detail="Subject already exists")
    subject = Subject(name=payload.name, code=payload.code)
    await subject.insert()
    return subject


@router.get("", response_model=List[Subject])
async def list_subjects(_=Depends(get_current_user)):
    return await Subject.find_all().to_list()


@router.patch("/{subject_id}/teachers", response_model=Subject)
async def set_subject_teachers(subject_id: PydanticObjectId, payload: SubjectUpdateTeachers, _=Depends(require_roles(Role.admin))):
    subject = await Subject.get(subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    subject.teacher_ids = payload.teacher_ids
    await subject.save()
    return subject


@router.delete("/{subject_id}")
async def delete_subject(subject_id: PydanticObjectId, _=Depends(require_roles(Role.admin))):
    subject = await Subject.get(subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    await subject.delete()
    return {"ok": True}
