import os
import asyncio
import asyncpg

async def init_db():
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    
    print("Connected. Running schema.sql...")
    
    with open("schema.sql", "r") as f:
        schema = f.read()
        
    await conn.execute(schema)
    
    print("Schema applied.")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(init_db())
