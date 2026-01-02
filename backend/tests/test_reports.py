import pytest


@pytest.mark.asyncio
async def test_create_and_fetch_report(client):
    signup_res = await client.post(
        "/auth/signup",
        json={"name": "Bob", "email": "bob@example.com", "password": "password123", "role": "teacher"},
    )
    user_id = signup_res.json()["id"]
    login_res = await client.post(
        "/auth/login",
        json={"email": "bob@example.com", "password": "password123"},
    )
    token = login_res.json()["access_token"]

    periods = [
        {
            "period_number": i,
            "subject": "Math",
            "topic": f"Topic {i}",
            "subject_teacher_id": user_id,
            "signed": True,
            "remarks": "",
        }
        for i in range(1, 9)
    ]
    report_res = await client.post(
        "/reports",
        json={
            "date": "2024-09-01",
            "class_name": "Grade 10-A",
            "class_teacher_id": user_id,
            "periods": periods,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert report_res.status_code == 200
    report = report_res.json()
    assert report["total_periods_taught"] == 8

    fetched = await client.get(f"/reports/{report['id']}", headers={"Authorization": f"Bearer {token}"})
    assert fetched.status_code == 200
    assert fetched.json()["id"] == report["id"]

    list_res = await client.get(
        "/reports",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1


@pytest.mark.asyncio
async def test_workload_analytics(client):
    signup_res = await client.post(
        "/auth/signup",
        json={"name": "Cara", "email": "cara@example.com", "password": "password123", "role": "teacher"},
    )
    user_id = signup_res.json()["id"]
    token = (
        await client.post(
            "/auth/login",
            json={"email": "cara@example.com", "password": "password123"},
        )
    ).json()["access_token"]

    periods = [
        {
            "period_number": i,
            "subject": "Science",
            "topic": f"Topic {i}",
            "subject_teacher_id": user_id,
            "signed": i % 2 == 0,
            "remarks": "",
        }
        for i in range(1, 9)
    ]
    await client.post(
        "/reports",
        json={
            "date": "2024-09-02",
            "class_name": "Grade 9-B",
            "class_teacher_id": user_id,
            "periods": periods,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    workload_res = await client.get(
        "/analytics/workload",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert workload_res.status_code == 200
    items = workload_res.json()["items"]
    assert items[0]["periods_taught"] == 4
