"""Shared infrastructure: Mongo client, admin JWT auth, id helpers."""
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
TOKEN_HOURS = 12
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "info@sipndine.com").lower()
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer(auto_error=False)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


async def seed_admin() -> None:
    await db.admins.create_index("email", unique=True)
    await db.admins.update_one(
        {"email": ADMIN_EMAIL},
        {"$setOnInsert": {"email": ADMIN_EMAIL, "password_hash": pwd.hash(ADMIN_PASSWORD), "role": "admin", "created_at": now_iso()}},
        upsert=True,
    )


def make_token(email: str) -> str:
    return jwt.encode({"sub": email, "role": "admin", "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_HOURS)}, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def current_admin(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> dict:
    unauthorized = HTTPException(status_code=401, detail="Staff sign-in required", headers={"WWW-Authenticate": "Bearer"})
    if not credentials:
        raise unauthorized
    try:
        claims = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.InvalidTokenError:
        raise unauthorized
    if claims.get("role") != "admin":
        raise unauthorized
    admin = await db.admins.find_one({"email": claims.get("sub"), "role": "admin"}, {"_id": 0, "password_hash": 0})
    if not admin:
        raise unauthorized
    return admin
