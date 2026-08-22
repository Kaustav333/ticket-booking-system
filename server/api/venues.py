from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from core.database import get_db_pool
from core.security import decode_access_token
from fastapi.security import OAuth2PasswordBearer
import json

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload

async def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_organiser(user: dict = Depends(get_current_user)):
    if user.get("role") not in ["admin", "organiser"]:
        raise HTTPException(status_code=403, detail="Organiser access required")
    return user

class VenueCreate(BaseModel):
    name: str
    location: str

class SeatLayoutCreate(BaseModel):
    section: str
    row_identifier: str
    seat_identifier: str
    default_category: Optional[str] = None
    coordinate_x: Optional[float] = None
    coordinate_y: Optional[float] = None

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_venue(venue: VenueCreate, org: dict = Depends(require_organiser)):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO venues (name, location) VALUES ($1, $2) RETURNING *",
            venue.name, venue.location
        )
        return dict(row)

@router.get("/")
async def list_venues(org: dict = Depends(require_organiser)):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM venues ORDER BY created_at DESC")
        return [dict(row) for row in rows]

@router.get("/{venue_id}")
async def get_venue(venue_id: str, org: dict = Depends(require_organiser)):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM venues WHERE id = $1", venue_id)
        if not row:
            raise HTTPException(status_code=404, detail="Venue not found")
        return dict(row)

@router.post("/{venue_id}/seats", status_code=status.HTTP_201_CREATED)
async def create_venue_seats(venue_id: str, seats: List[SeatLayoutCreate], org: dict = Depends(require_organiser)):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # Verify venue exists
        if not await conn.fetchval("SELECT 1 FROM venues WHERE id = $1", venue_id):
            raise HTTPException(status_code=404, detail="Venue not found")
            
        records = [(
            venue_id, s.section, s.row_identifier, s.seat_identifier, 
            s.default_category, s.coordinate_x, s.coordinate_y
        ) for s in seats]
        
        await conn.copy_records_to_table(
            'venue_layouts',
            columns=['venue_id', 'section', 'row_identifier', 'seat_identifier', 'default_category', 'coordinate_x', 'coordinate_y'],
            records=records
        )
        return {"status": "success", "count": len(seats)}
