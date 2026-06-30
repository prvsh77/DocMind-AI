#!/bin/sh

echo "Waiting for postgres..."

python -c "
import asyncio
import asyncpg
import sys
import os

async def check():
    db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres123@db:5432/docmind')
    db_url = db_url.replace('postgresql+asyncpg://', 'postgresql://')
    for _ in range(30):
        try:
            # Connect via asyncpg (matching our async database engine)
            conn = await asyncpg.connect(db_url)
            await conn.close()
            print('PostgreSQL is up!')
            sys.exit(0)
        except Exception as e:
            print(f'PostgreSQL is unavailable ({e}), waiting 1s...')
            await asyncio.sleep(1)
    sys.exit(1)

asyncio.run(check())
"

echo "Running migrations..."
alembic upgrade head

echo "Auto-seeding demo data if database is empty..."
python -c "
import asyncio
from sqlalchemy import select, func
from app.database.session import SessionLocal
from app.models import Document
import sys

async def check_and_seed():
    try:
        async with SessionLocal() as db:
            res = await db.execute(select(func.count(Document.id)))
            count = res.scalar() or 0
            if count == 0:
                print('Documents table is empty. Populating seed records...')
                import seed
                await seed.seed_data()
            else:
                print(f'Found {count} documents. Skipping auto-seed.')
    except Exception as e:
        print(f'Auto-seed check encountered an error: {e}')

asyncio.run(check_and_seed())
"

echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
