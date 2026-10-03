"""Guest-facing API: content, membership, offers/codes, reservations, enquiries, usage tracking, image proxy."""
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Response
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

from core import db, new_id, now_iso
from storage import get_object

router = APIRouter()

PUBLIC = {"_id": 0}


class CustomerInput(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str = Field(min_length=5, max_length=120)
    phone: str = Field(min_length=7, max_length=24)
    device_id: Optional[str] = None


class ClaimRequest(BaseModel):
    customer_id: str


class InquiryInput(BaseModel):
    customer_id: str
    manager_id: str
    offering: str
    date: str
    guests: str
    note: str = Field(default="", max_length=500)


class ReservationInput(BaseModel):
    customer_id: str
    date: str = Field(min_length=2, max_length=40)
    time: str = Field(min_length=2, max_length=40)
    party_size: str = Field(min_length=1, max_length=10)
    occasion: str = Field(default="", max_length=120)
    note: str = Field(default="", max_length=500)


class TrackInput(BaseModel):
    device_id: str = Field(min_length=6, max_length=80)
    platform: str = Field(default="unknown", max_length=20)
    customer_id: Optional[str] = None


async def get_settings() -> dict:
    return await db.settings.find_one({"settings_id": "main"}, PUBLIC) or {}


async def require_member(customer_id: str) -> dict:
    customer = await db.customers.find_one({"customer_id": customer_id}, PUBLIC)
    if not customer or not (customer.get("name") and customer.get("email") and customer.get("phone")):
        raise HTTPException(status_code=401, detail="Please sign in with your name, email and mobile to use privileges.")
    return customer


@router.get("/")
async def root():
    return {"message": "Sip 'n' Dine API"}


@router.get("/settings")
async def settings():
    return await get_settings()


@router.get("/home")
async def home():
    menu = await db.menu_items.find({"is_available": True}, PUBLIC).sort("sort_order", 1).to_list(200)
    return {
        "settings": await get_settings(),
        "favourites": [m for m in menu if m.get("is_favourite")],
        "new_additions": [m for m in menu if m.get("is_new")],
        "offers": await db.offers.find({"is_active": True}, PUBLIC).sort("sort_order", 1).to_list(20),
        "gallery": await db.gallery.find({}, PUBLIC).sort("sort_order", 1).to_list(20),
        "notifications": await db.notifications.find({}, PUBLIC).to_list(20),
    }


@router.get("/menu")
async def menu():
    return await db.menu_items.find({"is_available": True}, PUBLIC).sort("sort_order", 1).to_list(300)


@router.get("/offers")
async def offers():
    return await db.offers.find({"is_active": True}, PUBLIC).sort("sort_order", 1).to_list(50)


@router.get("/gallery")
async def gallery():
    return await db.gallery.find({}, PUBLIC).sort("sort_order", 1).to_list(50)


@router.get("/notifications")
async def notifications():
    return await db.notifications.find({}, PUBLIC).to_list(50)


@router.get("/managers")
async def managers():
    return await db.managers.find({}, PUBLIC).to_list(20)


@router.post("/track")
async def track(input: TrackInput):
    """Every app open is recorded per device so the house knows who uses the app."""
    update = {"$set": {"last_seen": now_iso(), "platform": input.platform}, "$inc": {"opens": 1}, "$setOnInsert": {"first_seen": now_iso()}}
    if input.customer_id:
        update["$set"]["customer_id"] = input.customer_id
    await db.app_sessions.update_one({"device_id": input.device_id}, update, upsert=True)
    return {"ok": True}


@router.post("/auth/sign-in")
async def sign_in(input: CustomerInput):
    email = input.email.strip().lower()
    fields = {"name": input.name.strip(), "phone": input.phone.strip(), "last_sign_in": now_iso()}
    existing = await db.customers.find_one({"email": email}, PUBLIC)
    if existing:
        await db.customers.update_one({"customer_id": existing["customer_id"]}, {"$set": fields, "$inc": {"sign_ins": 1}})
        customer = {**existing, **fields}
    else:
        customer = {"customer_id": new_id("cust"), "email": email, **fields, "tier": "Signature", "points": 1240, "points_to_next_tier": 760, "created_at": now_iso(), "sign_ins": 1}
        await db.customers.insert_one(dict(customer))
    if input.device_id:
        await db.app_sessions.update_one({"device_id": input.device_id}, {"$set": {"customer_id": customer["customer_id"], "last_seen": now_iso()}}, upsert=True)
    customer.pop("sign_ins", None)
    return customer


@router.get("/membership/{customer_id}")
async def membership(customer_id: str):
    customer = await db.customers.find_one({"customer_id": customer_id}, PUBLIC)
    if not customer:
        raise HTTPException(status_code=404, detail="Membership not found")
    return customer


@router.post("/offers/{offer_id}/claim")
async def claim_offer(offer_id: str, input: ClaimRequest):
    customer = await require_member(input.customer_id)
    offer = await db.offers.find_one({"offer_id": offer_id, "is_active": True}, PUBLIC)
    if not offer:
        raise HTTPException(status_code=404, detail="This offer is no longer available.")
    active = await db.redemptions.find_one({"customer_id": input.customer_id, "offer_id": offer_id, "status": "active", "expires_at": {"$gt": now_iso()}}, PUBLIC)
    if active:
        return {**active, "offer_title": offer["title"], "instruction": "Show this single-use code to your host before it expires."}
    # Anti-misuse: cap redemptions per member per offer per rolling 24h (admin-editable per offer).
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    used = await db.redemptions.count_documents({"customer_id": input.customer_id, "offer_id": offer_id, "status": "redeemed", "redeemed_at": {"$gte": since}})
    if used >= int(offer.get("max_per_day") or 1):
        raise HTTPException(status_code=429, detail="You've already used this privilege today. It resets after 24 hours.")
    # Anti-misuse: throttle code generation (max 5 codes per offer per hour).
    hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    minted = await db.redemptions.count_documents({"customer_id": input.customer_id, "offer_id": offer_id, "created_at": {"$gte": hour_ago}})
    if minted >= 5:
        raise HTTPException(status_code=429, detail="Too many codes requested. Please ask your host for help.")
    code = str(secrets.randbelow(900000) + 100000)
    while await db.redemptions.find_one({"code": code, "status": "active"}):
        code = str(secrets.randbelow(900000) + 100000)
    redemption = {"redemption_id": new_id("redeem"), "customer_id": input.customer_id, "customer_name": customer["name"], "offer_id": offer_id, "offer_title": offer["title"], "discount": offer["discount"], "code": code, "expires_at": (datetime.now(timezone.utc) + timedelta(seconds=60)).isoformat(), "status": "active", "created_at": now_iso()}
    await db.redemptions.insert_one(dict(redemption))
    return {**redemption, "instruction": "Show this single-use code to your host before it expires."}


@router.post("/inquiries")
async def create_inquiry(input: InquiryInput):
    customer = await require_member(input.customer_id)
    manager = await db.managers.find_one({"manager_id": input.manager_id}, PUBLIC)
    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found")
    inquiry = {"inquiry_id": new_id("inq"), **input.model_dump(), "customer_name": customer["name"], "customer_phone": customer["phone"], "customer_email": customer["email"], "manager_name": manager["name"], "status": "Received", "created_at": now_iso()}
    await db.inquiries.insert_one(dict(inquiry))
    return {"inquiry_id": inquiry["inquiry_id"], "status": "Received", "message": f"{manager['name']} will get back to you shortly."}


@router.post("/reservations")
async def create_reservation(input: ReservationInput):
    customer = await require_member(input.customer_id)
    reservation = {"reservation_id": new_id("resv"), **input.model_dump(), "customer_name": customer["name"], "customer_phone": customer["phone"], "customer_email": customer["email"], "status": "Requested", "created_at": now_iso()}
    await db.reservations.insert_one(dict(reservation))
    return {"reservation_id": reservation["reservation_id"], "status": "Requested", "message": "Request received. We'll confirm your table on WhatsApp shortly."}


@router.get("/reservations/mine/{customer_id}")
async def my_reservations(customer_id: str):
    return await db.reservations.find({"customer_id": customer_id}, PUBLIC).sort("created_at", -1).to_list(20)


@router.get("/files/{path:path}")
async def serve_file(path: str):
    """Public read-through for menu / gallery / hero images stored in object storage."""
    if not path.startswith("sip-n-dine/"):
        raise HTTPException(status_code=404, detail="Not found")
    try:
        content, content_type = await run_in_threadpool(get_object, path)
    except Exception:
        raise HTTPException(status_code=404, detail="Image not found")
    return Response(content=content, media_type=content_type, headers={"Cache-Control": "public, max-age=86400"})
