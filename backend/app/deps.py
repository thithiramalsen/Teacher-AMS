from beanie import PydanticObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from app.config import Settings, get_settings
from app.models.user import Role, User
from app.schemas.auth import TokenPayload
from app.services.auth import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme), settings: Settings = Depends(get_settings)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token, settings)
        token_data = TokenPayload(**payload)
    except JWTError:
        raise credentials_exception
    if token_data.sub is None:
        raise credentials_exception
    user = await User.get(PydanticObjectId(token_data.sub))
    if user is None:
        raise credentials_exception
    return user


def require_roles(*roles: Role):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        return current_user

    return role_checker
