from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import Settings, get_settings
from app.deps import get_current_user
from app.models.user import Role, User
from app.schemas.auth import LoginRequest, SignupRequest, Token, UserPublic
from app.services.auth import create_access_token, get_password_hash, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


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
    user = User(
        name=data.name,
        email=data.email,
        hashed_password=get_password_hash(data.password),
        role=data.role,
    )
    await user.insert()
    return UserPublic(id=str(user.id), name=user.name, email=user.email, role=user.role)


@router.get("/me", response_model=UserPublic)
async def me(current_user: User = Depends(get_current_user)) -> UserPublic:
    return UserPublic(id=str(current_user.id), name=current_user.name, email=current_user.email, role=current_user.role)
