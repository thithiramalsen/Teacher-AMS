from typing import List, Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.deps import get_current_user, require_roles
from app.models.user import Role
from app.models.classroom import Classroom

router = APIRouter(prefix="/classrooms", tags=["classrooms"])


class ClassroomCreate(BaseModel):
    name: str
    grade: Optional[str] = None


class ClassroomAssign(BaseModel):
    class_teacher_id: Optional[PydanticObjectId] = None
    subject_ids: List[PydanticObjectId] = Field(default_factory=list)


@router.post("", response_model=Classroom)
async def create_classroom(payload: ClassroomCreate, _=Depends(require_roles(Role.admin))):
    existing = await Classroom.find_one({"name": payload.name})
    if existing:
        raise HTTPException(status_code=400, detail="Classroom already exists")
    classroom = Classroom(name=payload.name, grade=payload.grade)
    await classroom.insert()
    return classroom


@router.get("", response_model=List[Classroom])
async def list_classrooms(_=Depends(get_current_user)):
    return await Classroom.find_all().to_list()


@router.patch("/{classroom_id}/assign", response_model=Classroom)
async def assign_classroom(classroom_id: PydanticObjectId, payload: ClassroomAssign, _=Depends(require_roles(Role.admin))):
    classroom = await Classroom.get(classroom_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    classroom.class_teacher_id = payload.class_teacher_id
    classroom.subject_ids = payload.subject_ids
    await classroom.save()
    return classroom


@router.delete("/{classroom_id}")
async def delete_classroom(classroom_id: PydanticObjectId, _=Depends(require_roles(Role.admin))):
    classroom = await Classroom.get(classroom_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    await classroom.delete()
    return {"ok": True}
