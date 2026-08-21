import asyncio
import asyncpg
async def main():
    conn = await asyncpg.connect("postgresql://postgres.wgvohfyhkfcevnjeizhg:Kaustav4%24567%24@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres")
    events = await conn.fetch("SELECT * FROM events")
    print(events)
    await conn.close()
asyncio.run(main())
