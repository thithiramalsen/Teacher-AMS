import pytest_asyncio
from beanie import init_beanie
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.config import Settings
from app.main import create_app
from app.models.report import DailyReport
from app.models.user import User


@pytest_asyncio.fixture
async def client():
    settings = Settings(
        mongodb_uri="mongodb://localhost:27017",
        mongodb_db="teacher_ams_test",
        jwt_secret="test-secret",
    )
    motor_client = AsyncMongoMockClient()
    app = create_app(settings=settings, motor_client=motor_client)

    db = motor_client[settings.mongodb_db]
    await init_beanie(database=db, document_models=[User, DailyReport])

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
