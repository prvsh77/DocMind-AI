from typing import AsyncGenerator

from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app import config

# Parse URL
url = make_url(config.DATABASE_URL)

# Remove unsupported parameters
query = dict(url.query)
query.pop("sslmode", None)
query.pop("channel_binding", None)

clean_url = url.set(query=query)

# Engine
engine = create_async_engine(
    clean_url,
    echo=False,
    connect_args={"ssl": True},
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session