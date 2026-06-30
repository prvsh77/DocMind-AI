from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from app.database.session import get_db
from app.models import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    AuthSession,
    UserResponse,
    RefreshRequest,
    RefreshResponse
)
from app.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.auth.dependencies import get_current_user

router = APIRouter()

@router.post("/register", response_model=AuthSession, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email exists
    result = await db.execute(select(User).where(User.email == payload.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = User(
        name=payload.fullName,
        email=payload.email,
        password_hash=hash_password(payload.password),
        company=payload.company,
        role="user"
    )
    db.add(new_user)
    await db.flush()
    
    access_token, access_expire = create_access_token(new_user.id)
    refresh_token, _ = create_refresh_token(new_user.id)
    
    await db.commit()
    
    user_resp = UserResponse.model_validate(new_user)
    
    return AuthSession(
        user=user_resp,
        accessToken=access_token,
        refreshToken=refresh_token,
        expiresAt=access_expire.isoformat()
    )

@router.post("/login", response_model=AuthSession)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    access_token, access_expire = create_access_token(user.id)
    refresh_token, _ = create_refresh_token(user.id)
    
    user_resp = UserResponse.model_validate(user)
    
    return AuthSession(
        user=user_resp,
        accessToken=access_token,
        refreshToken=refresh_token,
        expiresAt=access_expire.isoformat()
    )

@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token_endpoint(payload: RefreshRequest):
    token_payload = decode_token(payload.refreshToken)
    if not token_payload or token_payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
        
    user_id = token_payload.get("sub")
    access_token, access_expire = create_access_token(user_id)
    return RefreshResponse(
        accessToken=access_token,
        refreshToken=payload.refreshToken,
        expiresAt=access_expire.isoformat()
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"status": "ok"}
