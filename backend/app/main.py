from contextlib import asynccontextmanager
from typing import Optional

from beanie import init_beanie
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import Settings, get_settings
from app.models.report import DailyReport
from app.models.user import User
from app.routers import analytics, auth, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings: Settings = app.state.settings
    motor_client = app.state.motor_client
    created_client = False
    if motor_client is None:
        motor_client = AsyncIOMotorClient(settings.mongodb_uri)
        created_client = True
    db = motor_client[settings.mongodb_db]
    await init_beanie(database=db, document_models=[User, DailyReport])
    yield
    if created_client:
        motor_client.close()


def create_app(settings: Optional[Settings] = None, motor_client: Optional[AsyncIOMotorClient] = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(title="Teacher AMS Backend", lifespan=lifespan)
    app.state.settings = settings
    app.state.motor_client = motor_client

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router)
    app.include_router(reports.router)
    app.include_router(analytics.router)
    return app


app = create_app()
