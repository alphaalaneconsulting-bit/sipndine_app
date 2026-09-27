import os
import uuid

import pytest
import requests


BASE_URL = os.environ.get("EXPO_BACKEND_URL") or os.environ.get("EXPO_PUBLIC_BACKEND_URL")


@pytest.fixture(scope="module")
def api():
    if not BASE_URL:
        pytest.fail("Preview backend URL is not configured")
    return requests.Session()


def assert_no_mongo_id(value):
    if isinstance(value, dict):
        assert "_id" not in value
        for child in value.values():
            assert_no_mongo_id(child)
    elif isinstance(value, list):
        for child in value:
            assert_no_mongo_id(child)


def test_home_shape_and_hygiene(api):
    response = api.get(f"{BASE_URL}/api/home", timeout=15)
    assert response.status_code == 200
    body = response.json()
    assert body["hero"]["title"]
    assert body["offers"] and body["gallery"] and body["notifications"]
    assert_no_mongo_id(body)


@pytest.mark.parametrize("path", ["/offers", "/managers", "/notifications"])
def test_collection_endpoints(api, path):
    response = api.get(f"{BASE_URL}/api{path}", timeout=15)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert_no_mongo_id(response.json())


def test_sign_in_claim_and_inquiry(api):
    email = f"TEST_{uuid.uuid4().hex[:10]}@example.com"
    customer = api.post(f"{BASE_URL}/api/auth/sign-in", json={
        "name": "TEST QA Member", "email": email, "phone": "9876543210"
    }, timeout=15)
    assert customer.status_code == 200
    member = customer.json()
    assert member["email"] == email.lower()
    assert_no_mongo_id(member)

    offers = api.get(f"{BASE_URL}/api/offers", timeout=15).json()
    claim = api.post(f"{BASE_URL}/api/offers/{offers[0]['offer_id']}/claim",
                     json={"customer_id": member["customer_id"]}, timeout=15)
    assert claim.status_code == 200
    assert claim.json()["expires_at"] and claim.json()["code"]
    assert_no_mongo_id(claim.json())

    managers = api.get(f"{BASE_URL}/api/managers", timeout=15).json()
    inquiry = api.post(f"{BASE_URL}/api/inquiries", json={
        "customer_id": member["customer_id"], "manager_id": managers[0]["manager_id"],
        "offering": "TEST Banqueting", "date": "2026-12-20", "guests": "30", "note": "TEST"
    }, timeout=15)
    assert inquiry.status_code == 200
    assert inquiry.json()["status"] == "Received"
    assert_no_mongo_id(inquiry.json())