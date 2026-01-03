from datetime import timedelta
import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import Settings, get_settings
from app.deps import get_current_user
from app.models.user import Role, User
from app.schemas.auth import LoginRequest, SignupRequest, Token, UserPublic
from app.services.auth import create_access_token, get_password_hash, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


async def generate_display_id(prefix: str = "T", attempts: int = 5) -> str:
    """Generate a short, human-friendly ID and ensure it is not already used."""
    for _ in range(attempts):
        candidate = f"{prefix}-{uuid.uuid4().hex[:6].upper()}"
        existing = await User.find_one({"display_id": candidate})
        if not existing:
            return candidate
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not allocate display id")


@router.post("/login", response_model=Token)
async def login(data: LoginRequest, settings: Settings = Depends(get_settings)) -> Token:
    user = await User.find_one({"email": data.email})
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token, expires = create_access_token(str(user.id), settings, timedelta(minutes=settings.access_token_expire_minutes))
    return Token(access_token=token, expires_at=expires)


@router.post("/signup", response_model=UserPublic)
async def signup(data: SignupRequest, settings: Settings = Depends(get_settings)) -> UserPublic:
    existing = await User.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")
    display_id = await generate_display_id()
    user = User(
        name=data.name,
        email=data.email,
        hashed_password=get_password_hash(data.password),
        role=Role.teacher,
        display_id=display_id,
    )
    await user.insert()
    return UserPublic(id=str(user.id), name=user.name, email=user.email, role=user.role, display_id=user.display_id)


@router.get("/me", response_model=UserPublic)
async def me(current_user: User = Depends(get_current_user)) -> UserPublic:
    return UserPublic(
        id=str(current_user.id),
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        display_id=current_user.display_id,
    )
