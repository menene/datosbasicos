"""Shared fixtures for the backend test suite.

Tests must never touch the dev database. TEST_DATABASE_URL is always derived
from settings.database_url by forcing a "_testing" suffix on the database
name (per project convention — see CLAUDE.md's anti-wipe protocol), and the
fixtures below refuse to run if that suffix is missing.
"""
import asyncpg
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.models import departamento, indicador, region  # noqa: F401 — registers tables on Base.metadata


def _testing_database_url(url: str) -> str:
    base, _, db_name = url.rpartition("/")
    return url if db_name.endswith("_testing") else f"{base}/{db_name}_testing"


TEST_DATABASE_URL = _testing_database_url(settings.database_url)
assert TEST_DATABASE_URL.rsplit("/", 1)[-1].endswith("_testing"), (
    "Refusing to run tests against a non-'_testing' database"
)

test_engine = create_async_engine(TEST_DATABASE_URL)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)


async def _ensure_test_database_exists() -> None:
    admin_dsn = (
        TEST_DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://").rsplit("/", 1)[0]
        + "/postgres"
    )
    test_db_name = TEST_DATABASE_URL.rsplit("/", 1)[-1]
    conn = await asyncpg.connect(admin_dsn)
    try:
        exists = await conn.fetchval("SELECT 1 FROM pg_database WHERE datname = $1", test_db_name)
        if not exists:
            await conn.execute(f'CREATE DATABASE "{test_db_name}"')
    finally:
        await conn.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _test_database():
    await _ensure_test_database_exists()
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    await test_engine.dispose()


@pytest_asyncio.fixture
async def db_session(_test_database):
    async with TestSessionLocal() as session:
        yield session
    async with test_engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(table.delete())


@pytest_asyncio.fixture
async def client(db_session):
    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
