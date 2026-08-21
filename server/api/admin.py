from fastapi import APIRouter, Depends
from core.database import get_db_pool
from api.venues import require_admin

router = APIRouter()

@router.get("/metrics")
async def get_dashboard_metrics(admin: dict = Depends(require_admin)):
    """
    Admin Observability Dashboard derives metrics entirely from the event log.
    """
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # Holds / Sec (Last 5 mins)
        holds_sec = await conn.fetchval(
            "SELECT COUNT(*) / 300.0 FROM seat_events WHERE event_type = 'HOLD' AND timestamp > NOW() - INTERVAL '5 minutes'"
        )
        
        # Confirmations / Sec
        confirms_sec = await conn.fetchval(
            "SELECT COUNT(*) / 300.0 FROM seat_events WHERE event_type = 'CONFIRM' AND timestamp > NOW() - INTERVAL '5 minutes'"
        )
        
        # Active holds
        active_holds = await conn.fetchval(
            "SELECT COUNT(*) FROM seat_status_view WHERE status = 'HOLD' AND expires_at > NOW()"
        )
        
        # TTL Expirations Total
        expired = await conn.fetchval(
            "SELECT COUNT(*) FROM seat_events WHERE event_type = 'EXPIRE'"
        )
        
        # Cancellations
        cancellations = await conn.fetchval(
            "SELECT COUNT(*) FROM seat_events WHERE event_type = 'CANCEL'"
        )
        
        # Waitlist Size
        waitlist_size = await conn.fetchval(
            "SELECT COUNT(*) FROM waitlist_entries WHERE status = 'WAITING'"
        )
        
        # Waitlist Offer Conversion
        total_offers = await conn.fetchval("SELECT COUNT(*) FROM waitlist_offers")
        claimed_offers = await conn.fetchval("SELECT COUNT(*) FROM waitlist_offers WHERE status = 'CLAIMED'")
        conversion = (claimed_offers / total_offers) * 100 if total_offers > 0 else 0
        
        # Total Revenue
        revenue = await conn.fetchval("SELECT SUM(total_amount) FROM bookings WHERE status = 'CONFIRMED'")
        
        return {
            "holds_per_second": holds_sec,
            "confirmations_per_second": confirms_sec,
            "active_holds": active_holds,
            "ttl_expirations": expired,
            "cancellations": cancellations,
            "waitlist_size": waitlist_size,
            "waitlist_conversion_rate": conversion,
            "revenue": float(revenue) if revenue else 0
        }
