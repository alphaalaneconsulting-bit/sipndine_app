from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta, timezone
import secrets


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


class CustomerInput(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str = Field(min_length=5, max_length=120)
    phone: str = Field(min_length=7, max_length=24)


class Customer(BaseModel):
    customer_id: str
    name: str
    email: str
    phone: str
    tier: str = "Signature"
    points: int = 1240
    points_to_next_tier: int = 760


class ClaimRequest(BaseModel):
    customer_id: str


class InquiryInput(BaseModel):
    customer_id: str
    manager_id: str
    offering: str
    date: str
    guests: str
    note: str = Field(default="", max_length=500)


class VerificationInput(BaseModel):
    code: str


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def seed_content() -> None:
    """Create the small, editable content set used by the first venue launch."""
    if await db.offers.count_documents({}) == 0:
        await db.offers.insert_many([
            {"offer_id": "buffet-sunday", "kind": "Buffet", "title": "Sunday slow brunch", "subtitle": "A long lunch, served generously", "discount": "20% off", "validity": "Every Sunday · 12:30–4 PM", "color": "gold", "is_active": True},
            {"offer_id": "combo-date-night", "kind": "Combo", "title": "Table for two", "subtitle": "Two mains, dessert and a bottle", "discount": "₹1,799", "validity": "Valid through 30 Nov", "color": "plum", "is_active": True},
            {"offer_id": "inhouse-member", "kind": "In-house", "title": "Member dining privilege", "subtitle": "Verified at the table, one visit at a time", "discount": "10–30% off", "validity": "Based on your Signature tier", "color": "blue", "is_active": True},
        ])
    if await db.managers.count_documents({}) == 0:
        await db.managers.insert_many([
            {"manager_id": "manager-banquet", "name": "Rhea Kapoor", "role": "Banqueting & private dining", "status": "Available today", "status_color": "success", "specialty": "Celebrations from 20 to 200 guests", "phone": "+911234567890", "whatsapp": "911234567890"},
            {"manager_id": "manager-corporate", "name": "Kabir Sethi", "role": "Corporate dining & partnerships", "status": "Replies within 2 hours", "status_color": "info", "specialty": "Team lunches, launches and off-sites", "phone": "+911234567891", "whatsapp": "911234567891"},
        ])
    if await db.gallery.count_documents({}) == 0:
        await db.gallery.insert_many([
            {"gallery_id": "gallery-golden-hour", "eyebrow": "This weekend", "title": "Golden hour, poured slowly", "caption": "Live music · 6 PM onwards", "symbol": "sparkles"},
            {"gallery_id": "gallery-festival", "eyebrow": "Coming up", "title": "A festive table awaits", "caption": "Reserve your celebration menu", "symbol": "party.popper.fill"},
            {"gallery_id": "gallery-chef", "eyebrow": "From the kitchen", "title": "The chef's tasting notes", "caption": "New additions, arriving soon", "symbol": "fork.knife"},
        ])
    if await db.notifications.count_documents({}) == 0:
        await db.notifications.insert_many([
            {"notification_id": "notify-diwali", "eyebrow": "Festival note", "title": "A luminous Diwali to you", "body": "Join us for a festive evening of shared plates and warm pours.", "date_label": "18 Oct", "is_read": False},
            {"notification_id": "notify-jazz", "eyebrow": "Upcoming event", "title": "Friday jazz table", "body": "The trio returns this Friday. Members get first choice of tables.", "date_label": "25 Oct", "is_read": False},
        ])

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


@api_router.post("/auth/sign-in", response_model=Customer)
async def sign_in(input: CustomerInput):
    normalized_email = input.email.strip().lower()
    existing = await db.customers.find_one({"email": normalized_email}, {"_id": 0})
    if existing:
        await db.customers.update_one({"customer_id": existing["customer_id"]}, {"$set": {"name": input.name.strip(), "phone": input.phone.strip()}})
        existing["name"] = input.name.strip()
        existing["phone"] = input.phone.strip()
        return Customer(**existing)
    customer = Customer(customer_id=f"cust_{uuid.uuid4().hex[:10]}", name=input.name.strip(), email=normalized_email, phone=input.phone.strip())
    await db.customers.insert_one(customer.model_dump())
    return customer


@api_router.get("/home")
async def get_home():
    offers = await db.offers.find({"is_active": True}, {"_id": 0}).to_list(10)
    gallery = await db.gallery.find({}, {"_id": 0}).to_list(10)
    notifications = await db.notifications.find({}, {"_id": 0}).to_list(10)
    return {"hero": {"eyebrow": "SIP 'N' DINE · SECTOR 7", "title": "An unhurried table, made for you.", "caption": "Good food. Good company. A little more privilege."}, "offers": offers, "gallery": gallery, "notifications": notifications}


@api_router.get("/offers")
async def get_offers():
    return await db.offers.find({"is_active": True}, {"_id": 0}).to_list(50)


@api_router.get("/gallery")
async def get_gallery():
    return await db.gallery.find({}, {"_id": 0}).to_list(50)


@api_router.get("/notifications")
async def get_notifications():
    return await db.notifications.find({}, {"_id": 0}).to_list(50)


@api_router.get("/managers")
async def get_managers():
    return await db.managers.find({}, {"_id": 0}).to_list(20)


@api_router.get("/membership/{customer_id}", response_model=Customer)
async def get_membership(customer_id: str):
    customer = await db.customers.find_one({"customer_id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Membership not found")
    return Customer(**customer)


@api_router.post("/offers/{offer_id}/claim")
async def claim_offer(offer_id: str, input: ClaimRequest):
    customer = await db.customers.find_one({"customer_id": input.customer_id}, {"_id": 0})
    offer = await db.offers.find_one({"offer_id": offer_id, "is_active": True}, {"_id": 0})
    if not customer or not offer:
        raise HTTPException(status_code=404, detail="Offer or membership not found")
    active = await db.redemptions.find_one({"customer_id": input.customer_id, "offer_id": offer_id, "status": "active", "expires_at": {"$gt": now_iso()}}, {"_id": 0})
    if active:
        return active
    expires_at = (datetime.now(timezone.utc) + timedelta(seconds=60)).isoformat()
    redemption = {"redemption_id": f"redeem_{uuid.uuid4().hex[:10]}", "customer_id": input.customer_id, "offer_id": offer_id, "code": str(secrets.randbelow(900000) + 100000), "expires_at": expires_at, "status": "active", "created_at": now_iso()}
    await db.redemptions.insert_one(redemption.copy())
    return {**redemption, "offer_title": offer["title"], "instruction": "Show this single-use code to your host before it expires."}


@api_router.post("/redemptions/{redemption_id}/verify")
async def verify_redemption(redemption_id: str, input: VerificationInput):
    redemption = await db.redemptions.find_one({"redemption_id": redemption_id, "code": input.code}, {"_id": 0})
    if not redemption or redemption["status"] != "active" or redemption["expires_at"] <= now_iso():
        raise HTTPException(status_code=400, detail="Code expired or already redeemed")
    await db.redemptions.update_one({"redemption_id": redemption_id}, {"$set": {"status": "redeemed", "redeemed_at": now_iso()}})
    return {"success": True, "message": "Privilege verified successfully."}


@api_router.post("/redemptions/verify")
async def verify_redemption_by_code(input: VerificationInput):
    """Staff panel entry: verify by six-digit code alone."""
    redemption = await db.redemptions.find_one({"code": input.code}, {"_id": 0})
    if not redemption:
        raise HTTPException(status_code=404, detail="Code not found. Ask the guest to generate a fresh one.")
    if redemption["status"] == "redeemed":
        raise HTTPException(status_code=409, detail="This code was already redeemed.")
    if redemption["expires_at"] <= now_iso():
        raise HTTPException(status_code=410, detail="This code has expired. Ask the guest to generate a new one.")
    offer = await db.offers.find_one({"offer_id": redemption["offer_id"]}, {"_id": 0})
    customer = await db.customers.find_one({"customer_id": redemption["customer_id"]}, {"_id": 0})
    await db.redemptions.update_one({"redemption_id": redemption["redemption_id"]}, {"$set": {"status": "redeemed", "redeemed_at": now_iso()}})
    return {
        "success": True,
        "message": "Privilege verified. Apply the discount at billing.",
        "offer_title": offer["title"] if offer else "Member offer",
        "discount": offer["discount"] if offer else "",
        "member_name": customer["name"] if customer else "Member",
        "member_tier": customer.get("tier", "Signature") if customer else "Signature",
    }


@api_router.post("/inquiries")
async def create_inquiry(input: InquiryInput):
    manager = await db.managers.find_one({"manager_id": input.manager_id}, {"_id": 0})
    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found")
    customer = await db.customers.find_one({"customer_id": input.customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=401, detail="A valid membership is required to contact a manager")
    inquiry = {"inquiry_id": f"inq_{uuid.uuid4().hex[:10]}", **input.model_dump(), "status": "Received", "created_at": now_iso()}
    await db.inquiries.insert_one(inquiry.copy())
    return {"inquiry_id": inquiry["inquiry_id"], "status": "Received", "message": f"{manager['name']} will get back to you shortly."}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


@app.on_event("startup")
async def startup_seed():
    await seed_content()
