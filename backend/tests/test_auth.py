import pytest


@pytest.mark.asyncio
async def test_signup_and_login_flow(client):
    signup_res = await client.post(
        "/auth/signup",
        json={"name": "Alice", "email": "alice@example.com", "password": "password123", "role": "teacher"},
    )
    assert signup_res.status_code == 200
    login_res = await client.post(
        "/auth/login",
        json={"email": "alice@example.com", "password": "password123"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    me_res = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me = me_res.json()
    assert me["email"] == "alice@example.com"
    assert me["role"] == "teacher"
