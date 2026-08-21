# Ticket Booking System

A full-stack, event-sourced ticket booking system built with FastAPI (Python), PostgreSQL, and React.

## System Architecture
This project deliberately abandons Redis for seat holding. Instead, it relies on PostgreSQL as a single source of truth, utilizing an event-sourced `seat_events` table to immutably track seat states (HOLD, RELEASE, CONFIRM, EXPIRE) and derive real-time status.

Concurrency is handled natively by PostgreSQL using `SELECT ... FOR UPDATE` locks during the atomic checkout phase, guaranteeing zero race conditions and preventing double-booking without distributed caching complexity.

### Setup Guide

#### 1. Database Setup
Ensure Docker is running, then spin up the PostgreSQL database:
```bash
docker-compose up -d
```
Initialize the schema (if not using an automated migration tool):
```bash
docker-compose exec -T postgres psql -U ticket_user -d ticket_booking < server/schema.sql
```

#### 2. Backend (FastAPI) Setup
Navigate to the `server` directory and set up the Python environment:
```bash
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```
Copy `.env.example` to `.env` and start the server:
```bash
uvicorn main:app --reload
```

#### 3. Frontend (React + Vite) Setup
Navigate to the `client` directory:
```bash
cd client
npm install
npm run dev
```

## Database Schema (Brief)
- `users`: Customers, Organisers, Admins
- `events` & `venues`: Event logistics
- `seats`: Physical seats inherited from venue layouts
- `seat_events`: The immutable event log for every seat state change
- `seat_status_view`: A materialized/derived view that finds the current state of a seat instantly
- `bookings`: Finalized booking details
- `waitlist_entries` & `waitlist_offers`: Manages the priority-scored waitlist algorithm
