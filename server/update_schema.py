import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def update_schema():
    print("Connecting to database...")
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        print("Adding average_rating column to events table...")
        await conn.execute("ALTER TABLE events ADD COLUMN average_rating DECIMAL(3,1);")
        print("Successfully added average_rating column.")
    except asyncpg.exceptions.DuplicateColumnError:
        print("Column average_rating already exists. Skipping.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(update_schema())
