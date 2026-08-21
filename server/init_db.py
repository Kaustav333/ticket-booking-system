import asyncio
import asyncpg

async def init_db():
    conn = await asyncpg.connect("postgresql://postgres.wgvohfyhkfcevnjeizhg:Kaustav4%24567%24@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres")
    
    print("Connected. Running schema.sql...")
    
    with open("schema.sql", "r") as f:
        schema = f.read()
        
    await conn.execute(schema)
    
    print("Schema applied.")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(init_db())
