from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.database import db
from api import auth, venues, events, bookings, waitlist, admin
from core.socket import socket_app
from services.sweeper import start_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db.connect()
    start_scheduler()
    yield
    # Shutdown
    await db.disconnect()

app = FastAPI(title="Ticket Booking API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/socket.io", socket_app)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(venues.router, prefix="/api/venues", tags=["Venues"])
app.include_router(events.router, prefix="/api/events", tags=["Events"])
app.include_router(events.router, prefix="/api/events", tags=["Events"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(waitlist.router, prefix="/api", tags=["Waitlist"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}
