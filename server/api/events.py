from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List
from datetime import datetime
from core.database import get_db_pool
from api.venues import get_current_user, require_organiser

router = APIRouter()

class EventCreate(BaseModel):
    venue_id: str
    title: str
    start_time: datetime
    end_time: datetime
    payment_details: str | None = None
    payment_qr_url: str | None = None
    thumbnail_url: str | None = None

class EventCategoryCreate(BaseModel):
    name: str
    price: float

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_event(event: EventCreate, org: dict = Depends(require_organiser)):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            # Create event
            evt_row = await conn.fetchrow(
                """
                INSERT INTO events (organiser_id, venue_id, title, start_time, end_time, payment_details, payment_qr_url, thumbnail_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
                """,
                org['sub'], event.venue_id, event.title, event.start_time, event.end_time, event.payment_details, event.payment_qr_url, event.thumbnail_url
            )
            event_id = evt_row['id']
            
            # Note: Categories and seats would normally be created here based on the layout,
            # but we'll expose a separate endpoint to instantiate seats for an event to keep it modular.
            return dict(evt_row)

@router.post("/{event_id}/categories")
async def add_categories(event_id: str, categories: List[EventCategoryCreate], org: dict = Depends(require_organiser)):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # Verify ownership
        owner = await conn.fetchval("SELECT organiser_id FROM events WHERE id = $1", event_id)
        if str(owner) != org['sub'] and org.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not your event")
            
        records = [(event_id, c.name, c.price) for c in categories]
        await conn.copy_records_to_table(
            'event_seat_categories',
            columns=['event_id', 'name', 'price'],
            records=records
        )
        return {"status": "success"}

@router.get("/{event_id}/categories")
async def get_categories(event_id: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT id, name, price FROM event_seat_categories WHERE event_id = $1", event_id)
        return [dict(row) for row in rows]

@router.post("/{event_id}/instantiate_seats")
async def instantiate_seats(event_id: str, org: dict = Depends(require_organiser)):
    """Copies the layout from the venue into the actual instantiated seats for this specific event."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            # Verify ownership
            evt = await conn.fetchrow("SELECT organiser_id, venue_id FROM events WHERE id = $1", event_id)
            if not evt:
                raise HTTPException(status_code=404, detail="Event not found")
            if str(evt['organiser_id']) != org['sub'] and org.get("role") != "admin":
                raise HTTPException(status_code=403, detail="Not your event")

            # Simple logic: map default categories to actual category IDs
            await conn.execute(
                """
                INSERT INTO seats (event_id, category_id, section, row_identifier, seat_identifier, coordinate_x, coordinate_y)
                SELECT 
                    $1,
                    c.id,
                    vl.section, vl.row_identifier, vl.seat_identifier, vl.coordinate_x, vl.coordinate_y
                FROM venue_layouts vl
                LEFT JOIN event_seat_categories c ON c.event_id = $1 AND c.name = vl.default_category
                WHERE vl.venue_id = $2
                """,
                event_id, evt['venue_id']
            )
        return {"status": "success"}

@router.get("/")
async def list_events():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM events ORDER BY start_time ASC")
        return [dict(row) for row in rows]

@router.get("/{event_id}")
async def get_event(event_id: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM events WHERE id = $1", event_id)
        if not row:
            raise HTTPException(status_code=404, detail="Event not found")
        return dict(row)

@router.get("/{event_id}/map")
async def get_event_map(event_id: str):
    """Public endpoint to get seats and their current status derived from the event store."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT s.id as seat_id, s.section, s.row_identifier, s.seat_identifier, c.price, c.name as category_name,
                   COALESCE(sv.status::text, 'AVAILABLE') as status
            FROM seats s
            LEFT JOIN event_seat_categories c ON s.category_id = c.id
            LEFT JOIN seat_status_view sv ON s.id = sv.seat_id
            WHERE s.event_id = $1
            """,
            event_id
        )
        return [dict(row) for row in rows]

@router.get("/{event_id}/summary")
async def get_event_summary(event_id: str, org: dict = Depends(require_organiser)):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        owner = await conn.fetchval("SELECT organiser_id FROM events WHERE id = $1", event_id)
        if str(owner) != org['sub'] and org.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not your event")
            
        total_bookings = await conn.fetchval("SELECT COUNT(*) FROM bookings WHERE event_id = $1", event_id)
        confirmed_bookings = await conn.fetchval("SELECT COUNT(*) FROM bookings WHERE event_id = $1 AND status = 'CONFIRMED'", event_id)
        cancelled_bookings = await conn.fetchval("SELECT COUNT(*) FROM bookings WHERE event_id = $1 AND status = 'CANCELLED'", event_id)
        revenue = await conn.fetchval("SELECT SUM(total_amount) FROM bookings WHERE event_id = $1 AND status = 'CONFIRMED'", event_id)
        
        return {
            "total_bookings": total_bookings,
            "confirmed_bookings": confirmed_bookings,
            "cancelled_bookings": cancelled_bookings,
            "revenue": float(revenue) if revenue else 0
        }
