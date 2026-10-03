"""Sip 'n' Dine API entrypoint. Routes live in routes_public.py and routes_admin.py."""
import logging

from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware

from core import client, seed_admin
from routes_admin import router as admin_router
from routes_public import router as public_router
from seed import seed_content
from storage import init_storage

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Sip 'n' Dine API")
api_router = APIRouter(prefix="/api")
api_router.include_router(public_router)
api_router.include_router(admin_router)
app.include_router(api_router)

app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.on_event("startup")
async def startup():
    await seed_admin()
    await seed_content()
    try:
        init_storage()
    except Exception as exc:  # images still fail gracefully per-request
        logger.warning("object storage init failed: %s", exc)


@app.on_event("shutdown")
async def shutdown():
    client.close()
