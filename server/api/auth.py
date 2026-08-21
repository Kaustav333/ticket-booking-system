from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from core.database import get_db_pool
from core.security import get_password_hash, verify_password, create_access_token

router = APIRouter()

class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    role: Optional[str] = "customer"

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user: UserRegister):
    pool = await get_db_pool()
    hashed_password = get_password_hash(user.password)
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO users (email, password_hash, name, role)
                VALUES ($1, $2, $3, $4)
                RETURNING id, email, name, role
                """,
                user.email, hashed_password, user.name, user.role
            )
            
            token = create_access_token(data={"sub": str(row['id']), "role": row['role']})
            return {
                "access_token": token,
                "token_type": "bearer",
                "user": dict(row)
            }
    except Exception as e:
        if "unique constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, email, password_hash, name, role FROM users WHERE email = $1",
            user.email
        )
        if not row or not verify_password(user.password, row['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = create_access_token(data={"sub": str(row['id']), "role": row['role']})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": str(row['id']),
                "email": row['email'],
                "name": row['name'],
                "role": row['role']
            }
        }
