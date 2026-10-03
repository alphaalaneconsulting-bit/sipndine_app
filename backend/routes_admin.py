"""Staff/admin API: login, settings, generic content CRUD, uploads, bookings, enquiries, customers, redemptions."""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

from core import ADMIN_EMAIL, current_admin, db, make_token, new_id, now_iso, pwd
from storage import APP_NAME, put_object

router = APIRouter(prefix="/admin")
PUBLIC = {"_id": 0}

# collection name -> (mongo collection, id field, id prefix, default sort)
COLLECTIONS = {
    "menu": ("menu_items", "item_id", "item", "sort_order"),
    "offers": ("offers", "offer_id", "offer", "sort_order"),
    "gallery": ("gallery", "gallery_id", "gallery", "sort_order"),
    "notifications": ("notifications", "notification_id", "notify", "created_at"),
    "managers": ("managers", "manager_id", "manager", "name"),
}


class LoginInput(BaseModel):
    email: str
    password: str


class StatusInput(BaseModel):
    status: str = Field(min_length=2, max_length=40)


class VerificationInput(BaseModel):
    code: str


class PasswordInput(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=80)


def resolve(collection: str):
    if collection not in COLLECTIONS:
        raise HTTPException(status_code=404, detail="Unknown section")
    return COLLECTIONS[collection]


@router.post("/login")
async def login(input: LoginInput):
    email = input.email.strip().lower()
    admin = await db.admins.find_one({"email": email})
    valid = pwd.verify(input.password, admin["password_hash"]) if admin else pwd.verify(input.password, pwd.hash("unusable-dummy-password"))
    if not admin or not valid:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"access_token": make_token(email), "token_type": "bearer", "email": email}


@router.get("/me")
async def me(admin=Depends(current_admin)):
    return admin


@router.post("/password")
async def change_password(input: PasswordInput, admin=Depends(current_admin)):
    record = await db.admins.find_one({"email": admin["email"]})
    if not pwd.verify(input.current_password, record["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await db.admins.update_one({"email": admin["email"]}, {"$set": {"password_hash": pwd.hash(input.new_password)}})
    return {"ok": True}


@router.get("/stats")
async def stats(_=Depends(current_admin)):
    today = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    return {
        "customers": await db.customers.count_documents({}),
        "app_devices": await db.app_sessions.count_documents({}),
        "reservations_pending": await db.reservations.count_documents({"status": "Requested"}),
        "inquiries_pending": await db.inquiries.count_documents({"status": "Received"}),
        "redemptions_today": await db.redemptions.count_documents({"status": "redeemed", "redeemed_at": {"$gte": today}}),
        "menu_items": await db.menu_items.count_documents({}),
        "offers": await db.offers.count_documents({"is_active": True}),
    }


@router.get("/settings")
async def get_settings(_=Depends(current_admin)):
    return await db.settings.find_one({"settings_id": "main"}, PUBLIC) or {}


@router.put("/settings")
async def update_settings(body: dict[str, Any], _=Depends(current_admin)):
    body.pop("_id", None)
    body["settings_id"] = "main"
    body["updated_at"] = now_iso()
    await db.settings.update_one({"settings_id": "main"}, {"$set": body}, upsert=True)
    return await db.settings.find_one({"settings_id": "main"}, PUBLIC)


@router.get("/content/{collection}")
async def list_items(collection: str, _=Depends(current_admin)):
    coll, _id, _prefix, sort = resolve(collection)
    return await db[coll].find({}, PUBLIC).sort(sort, 1).to_list(500)


@router.post("/content/{collection}")
async def create_item(collection: str, body: dict[str, Any], _=Depends(current_admin)):
    coll, id_field, prefix, _sort = resolve(collection)
    body.pop("_id", None)
    body[id_field] = body.get(id_field) or new_id(prefix)
    body["created_at"] = now_iso()
    if await db[coll].find_one({id_field: body[id_field]}):
        raise HTTPException(status_code=409, detail="An item with this id already exists")
    await db[coll].insert_one(dict(body))
    return body


@router.put("/content/{collection}/{item_id}")
async def update_item(collection: str, item_id: str, body: dict[str, Any], _=Depends(current_admin)):
    coll, id_field, _prefix, _sort = resolve(collection)
    body.pop("_id", None)
    body.pop(id_field, None)
    body["updated_at"] = now_iso()
    result = await db[coll].update_one({id_field: item_id}, {"$set": body})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Item not found")
    return await db[coll].find_one({id_field: item_id}, PUBLIC)


@router.delete("/content/{collection}/{item_id}")
async def delete_item(collection: str, item_id: str, _=Depends(current_admin)):
    coll, id_field, _prefix, _sort = resolve(collection)
    result = await db[coll].delete_one({id_field: item_id})
    if not result.deleted_count:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"ok": True}


@router.post("/upload")
async def upload(file: UploadFile = File(...), _=Depends(current_admin)):
    data = await file.read()
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Please upload an image under 8 MB")
    content_type = file.content_type or "image/jpeg"
    ext = {"image/png": "png", "image/webp": "webp"}.get(content_type, "jpg")
    path = f"{APP_NAME}/uploads/{uuid.uuid4().hex}.{ext}"
    try:
        await run_in_threadpool(put_object, path, data, content_type)
    except Exception as exc:
        status = getattr(getattr(exc, "response", None), "status_code", 500)
        if status == 402:
            raise HTTPException(status_code=402, detail="Storage credits exhausted. Top up to upload more photos.")
        raise HTTPException(status_code=502, detail="Upload failed. Please try again.")
    await db.uploads.insert_one({"path": path, "name": file.filename, "content_type": content_type, "size": len(data), "created_at": now_iso()})
    return {"path": path}


@router.get("/reservations")
async def reservations(_=Depends(current_admin)):
    return await db.reservations.find({}, PUBLIC).sort("created_at", -1).to_list(500)


@router.patch("/reservations/{reservation_id}")
async def update_reservation(reservation_id: str, input: StatusInput, _=Depends(current_admin)):
    result = await db.reservations.update_one({"reservation_id": reservation_id}, {"$set": {"status": input.status, "updated_at": now_iso()}})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Reservation not found")
    return {"ok": True}


@router.get("/inquiries")
async def inquiries(_=Depends(current_admin)):
    return await db.inquiries.find({}, PUBLIC).sort("created_at", -1).to_list(500)


@router.patch("/inquiries/{inquiry_id}")
async def update_inquiry(inquiry_id: str, input: StatusInput, _=Depends(current_admin)):
    result = await db.inquiries.update_one({"inquiry_id": inquiry_id}, {"$set": {"status": input.status, "updated_at": now_iso()}})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    return {"ok": True}


@router.get("/customers")
async def customers(_=Depends(current_admin)):
    people = await db.customers.find({}, PUBLIC).sort("created_at", -1).to_list(2000)
    sessions = await db.app_sessions.find({}, PUBLIC).to_list(5000)
    by_customer: dict[str, list] = {}
    for session in sessions:
        if session.get("customer_id"):
            by_customer.setdefault(session["customer_id"], []).append(session)
    for person in people:
        linked = by_customer.get(person["customer_id"], [])
        person["devices"] = len(linked)
        person["app_opens"] = sum(s.get("opens", 0) for s in linked)
        person["last_seen"] = max((s.get("last_seen", "") for s in linked), default=person.get("last_sign_in", ""))
    anonymous = [s for s in sessions if not s.get("customer_id")]
    return {"customers": people, "anonymous_devices": len(anonymous), "anonymous_opens": sum(s.get("opens", 0) for s in anonymous)}


@router.get("/redemptions")
async def redemptions(_=Depends(current_admin)):
    return await db.redemptions.find({}, {"_id": 0, "code": 0}).sort("created_at", -1).to_list(500)


@router.post("/verify")
async def verify_code(input: VerificationInput, _=Depends(current_admin)):
    code = input.code.strip()
    redemption = await db.redemptions.find_one({"code": code, "status": "active"}, PUBLIC) or await db.redemptions.find_one({"code": code}, PUBLIC)
    if not redemption:
        raise HTTPException(status_code=404, detail="Code not found. Ask the guest to generate a fresh one.")
    if redemption["status"] == "redeemed":
        raise HTTPException(status_code=409, detail="This code was already redeemed.")
    if redemption["expires_at"] <= now_iso():
        raise HTTPException(status_code=410, detail="This code has expired. Ask the guest to generate a new one.")
    customer = await db.customers.find_one({"customer_id": redemption["customer_id"]}, PUBLIC)
    await db.redemptions.update_one({"redemption_id": redemption["redemption_id"]}, {"$set": {"status": "redeemed", "redeemed_at": now_iso(), "verified_by": ADMIN_EMAIL}})
    return {
        "success": True,
        "message": "Privilege verified. Apply the discount at billing.",
        "offer_title": redemption.get("offer_title", "Member offer"),
        "discount": redemption.get("discount", ""),
        "member_name": customer["name"] if customer else "Member",
        "member_phone": customer["phone"] if customer else "",
        "member_tier": customer.get("tier", "Signature") if customer else "Signature",
    }
