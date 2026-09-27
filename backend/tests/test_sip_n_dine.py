"""Full backend regression for Sip 'N' Dine rebrand + admin verify flow."""
import os
import uuid

import pytest
import requests


BASE_URL = (os.environ.get("EXPO_BACKEND_URL") or os.environ.get("EXPO_PUBLIC_BACKEND_URL") or "https://mobile-app-staging-29.preview.emergentagent.com").rstrip("/")


def _no_id(value):
    if isinstance(value, dict):
        assert "_id" not in value, f"MongoDB _id leaked: keys={list(value.keys())}"
        for v in value.values():
            _no_id(v)
    elif isinstance(value, list):
        for v in value:
            _no_id(v)


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def member(api):
    email = f"TEST_qa_{uuid.uuid4().hex[:8]}@sipndine.com"
    r = api.post(f"{BASE_URL}/api/auth/sign-in", json={
        "name": "QA Tester", "email": email, "phone": "+911234567890",
    }, timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    _no_id(body)
    assert body["customer_id"] and body["email"] == email.lower()
    assert body["name"] == "QA Tester"
    return body


# 1) GET /api/home returns hero + offers + gallery + notifications
def test_home_shape(api):
    r = api.get(f"{BASE_URL}/api/home", timeout=15)
    assert r.status_code == 200
    body = r.json()
    for key in ("hero", "offers", "gallery", "notifications"):
        assert key in body and body[key], f"missing {key}"
    assert body["hero"]["eyebrow"] == "SIP 'N' DINE · SECTOR 7"
    _no_id(body)


# 2) Collection endpoints return lists without _id
@pytest.mark.parametrize("path", ["/offers", "/gallery", "/notifications", "/managers"])
def test_collections(api, path):
    r = api.get(f"{BASE_URL}/api{path}", timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list) and body
    _no_id(body)


# 3) sign-in returns Customer object
def test_sign_in_returns_customer(member):
    assert member["tier"] and isinstance(member["points"], int)


# 4) claim returns redemption with 6-digit code + 60s expiry
def test_claim_buffet_sunday_returns_code(api, member):
    r = api.post(f"{BASE_URL}/api/offers/buffet-sunday/claim",
                 json={"customer_id": member["customer_id"]}, timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    _no_id(body)
    assert body["code"].isdigit() and len(body["code"]) == 6
    assert body["expires_at"] and body["offer_id"] == "buffet-sunday"
    pytest.shared_code = body["code"]


# 5) verify success + offer_title + discount + member_name
def test_verify_success(api, member):
    code = pytest.shared_code
    r = api.post(f"{BASE_URL}/api/redemptions/verify", json={"code": code}, timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    _no_id(body)
    assert body["success"] is True
    assert body["offer_title"] == "Sunday slow brunch"
    assert body["discount"] == "20% off"
    assert body["member_name"] == "QA Tester"


# 6) Retry same code -> 409 already redeemed
def test_verify_replay_409(api):
    r = api.post(f"{BASE_URL}/api/redemptions/verify",
                 json={"code": pytest.shared_code}, timeout=15)
    assert r.status_code == 409, r.text
    assert "already" in r.json()["detail"].lower()


# 7) verify "000000" -> 404
def test_verify_unknown_code_404(api):
    r = api.post(f"{BASE_URL}/api/redemptions/verify",
                 json={"code": "000000"}, timeout=15)
    assert r.status_code == 404, r.text
    assert "not found" in r.json()["detail"].lower()


# 8) inquiry WITHOUT valid customer_id -> 401
def test_inquiry_requires_membership(api):
    managers = api.get(f"{BASE_URL}/api/managers", timeout=15).json()
    r = api.post(f"{BASE_URL}/api/inquiries", json={
        "customer_id": "cust_does_not_exist",
        "manager_id": managers[0]["manager_id"],
        "offering": "TEST Banqueting", "date": "2026-12-20", "guests": "30",
        "note": "TEST unauth",
    }, timeout=15)
    assert r.status_code == 401, f"expected 401, got {r.status_code}: {r.text}"


# 9) inquiry WITH valid customer_id -> 200 with Received
def test_inquiry_success(api, member):
    managers = api.get(f"{BASE_URL}/api/managers", timeout=15).json()
    r = api.post(f"{BASE_URL}/api/inquiries", json={
        "customer_id": member["customer_id"],
        "manager_id": managers[0]["manager_id"],
        "offering": "TEST Banqueting", "date": "2026-12-20", "guests": "30",
        "note": "TEST",
    }, timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    _no_id(body)
    assert body["status"] == "Received"
