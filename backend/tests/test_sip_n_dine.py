"""Backend contract tests for Sip 'n' Dine (run against the preview URL)."""
import os
import uuid

import pytest
import requests

BASE_URL = (os.environ.get("EXPO_BACKEND_URL") or os.environ.get("EXPO_PUBLIC_BACKEND_URL") or "http://localhost:8001").rstrip("/")
ADMIN = {"email": "info@sipndine.com", "password": "sipndine2026"}


@pytest.fixture(scope="module")
def api():
    return requests.Session()


@pytest.fixture(scope="module")
def admin_headers(api):
    res = api.post(f"{BASE_URL}/api/admin/login", json=ADMIN, timeout=15)
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.fixture(scope="module")
def member(api):
    payload = {"name": "Pytest Guest", "email": f"pytest-{uuid.uuid4().hex[:6]}@example.com", "phone": "9876500000", "device_id": "dev_pytest"}
    res = api.post(f"{BASE_URL}/api/auth/sign-in", json=payload, timeout=15)
    assert res.status_code == 200, res.text
    return res.json()


def test_home_payload(api):
    data = api.get(f"{BASE_URL}/api/home", timeout=15).json()
    assert data["settings"]["brand_name"]
    assert data["settings"]["whatsapp"] and data["settings"]["address"]
    assert data["favourites"] and data["new_additions"] and data["offers"] and data["gallery"]
    assert all("_id" not in item for item in data["favourites"])


def test_menu_and_image_proxy(api):
    menu = api.get(f"{BASE_URL}/api/menu", timeout=15).json()
    assert len(menu) >= 10
    with_image = next(item for item in menu if item.get("image"))
    res = api.get(f"{BASE_URL}/api/files/{with_image['image']}", timeout=30)
    assert res.status_code == 200 and res.headers["content-type"].startswith("image/")


def test_track_open(api):
    res = api.post(f"{BASE_URL}/api/track", json={"device_id": "dev_pytest", "platform": "test"}, timeout=15)
    assert res.status_code == 200


def test_reservation_requires_member(api, member):
    anon = api.post(f"{BASE_URL}/api/reservations", json={"customer_id": "nope", "date": "Today", "time": "8:00 PM", "party_size": "2"}, timeout=15)
    assert anon.status_code == 401
    ok = api.post(f"{BASE_URL}/api/reservations", json={"customer_id": member["customer_id"], "date": "Today", "time": "8:00 PM", "party_size": "2", "occasion": "Birthday", "note": "window"}, timeout=15)
    assert ok.status_code == 200 and ok.json()["status"] == "Requested"
    mine = api.get(f"{BASE_URL}/api/reservations/mine/{member['customer_id']}", timeout=15).json()
    assert mine and mine[0]["customer_phone"] == "9876500000"


def test_claim_verify_and_anti_misuse(api, member, admin_headers):
    offers = api.get(f"{BASE_URL}/api/offers", timeout=15).json()
    offer_id = offers[0]["offer_id"]
    anon = api.post(f"{BASE_URL}/api/offers/{offer_id}/claim", json={"customer_id": "ghost"}, timeout=15)
    assert anon.status_code == 401
    claim = api.post(f"{BASE_URL}/api/offers/{offer_id}/claim", json={"customer_id": member["customer_id"]}, timeout=15)
    assert claim.status_code == 200
    code = claim.json()["code"]
    assert len(code) == 6
    # same active code is returned on re-claim
    again = api.post(f"{BASE_URL}/api/offers/{offer_id}/claim", json={"customer_id": member["customer_id"]}, timeout=15).json()
    assert again["code"] == code
    # verify requires staff token
    assert api.post(f"{BASE_URL}/api/admin/verify", json={"code": code}, timeout=15).status_code == 401
    verified = api.post(f"{BASE_URL}/api/admin/verify", json={"code": code}, headers=admin_headers, timeout=15)
    assert verified.status_code == 200 and verified.json()["member_phone"] == "9876500000"
    # second use rejected
    assert api.post(f"{BASE_URL}/api/admin/verify", json={"code": code}, headers=admin_headers, timeout=15).status_code == 409
    # daily cap: a new claim on the same offer is blocked for 24h
    capped = api.post(f"{BASE_URL}/api/offers/{offer_id}/claim", json={"customer_id": member["customer_id"]}, timeout=15)
    assert capped.status_code == 429
    assert api.post(f"{BASE_URL}/api/admin/verify", json={"code": "000000"}, headers=admin_headers, timeout=15).status_code == 404


def test_admin_login_and_guards(api):
    assert api.post(f"{BASE_URL}/api/admin/login", json={"email": ADMIN["email"], "password": "wrong"}, timeout=15).status_code == 401
    assert api.get(f"{BASE_URL}/api/admin/stats", timeout=15).status_code == 401
    assert api.get(f"{BASE_URL}/api/admin/stats", headers={"Authorization": "Bearer garbage"}, timeout=15).status_code == 401


def test_admin_settings_roundtrip(api, admin_headers):
    settings = api.get(f"{BASE_URL}/api/admin/settings", headers=admin_headers, timeout=15).json()
    original = settings["hours"]
    settings["hours"] = "Pytest hours"
    saved = api.put(f"{BASE_URL}/api/admin/settings", json=settings, headers=admin_headers, timeout=15)
    assert saved.status_code == 200 and saved.json()["hours"] == "Pytest hours"
    assert api.get(f"{BASE_URL}/api/settings", timeout=15).json()["hours"] == "Pytest hours"
    settings["hours"] = original
    api.put(f"{BASE_URL}/api/admin/settings", json=settings, headers=admin_headers, timeout=15)


def test_admin_content_crud(api, admin_headers):
    created = api.post(f"{BASE_URL}/api/admin/content/menu", json={"name": "Pytest dish", "price": "₹1", "category": "Starters", "is_available": True, "sort_order": 999}, headers=admin_headers, timeout=15)
    assert created.status_code == 200
    item_id = created.json()["item_id"]
    assert any(m["item_id"] == item_id for m in api.get(f"{BASE_URL}/api/menu", timeout=15).json())
    updated = api.put(f"{BASE_URL}/api/admin/content/menu/{item_id}", json={"name": "Pytest dish 2", "is_available": False}, headers=admin_headers, timeout=15)
    assert updated.status_code == 200 and updated.json()["name"] == "Pytest dish 2"
    assert not any(m["item_id"] == item_id for m in api.get(f"{BASE_URL}/api/menu", timeout=15).json())
    assert api.delete(f"{BASE_URL}/api/admin/content/menu/{item_id}", headers=admin_headers, timeout=15).status_code == 200
    assert api.delete(f"{BASE_URL}/api/admin/content/menu/{item_id}", headers=admin_headers, timeout=15).status_code == 404
    assert api.get(f"{BASE_URL}/api/admin/content/unknown", headers=admin_headers, timeout=15).status_code == 404


def test_admin_lists(api, admin_headers, member):
    customers = api.get(f"{BASE_URL}/api/admin/customers", headers=admin_headers, timeout=15).json()
    assert any(c["customer_id"] == member["customer_id"] for c in customers["customers"])
    reservations = api.get(f"{BASE_URL}/api/admin/reservations", headers=admin_headers, timeout=15).json()
    target = next(r for r in reservations if r["customer_name"] == "Pytest Guest")
    assert api.patch(f"{BASE_URL}/api/admin/reservations/{target['reservation_id']}", json={"status": "Confirmed"}, headers=admin_headers, timeout=15).status_code == 200
    log = api.get(f"{BASE_URL}/api/admin/redemptions", headers=admin_headers, timeout=15).json()
    assert log and "code" not in log[0]
