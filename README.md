# AuraTix - Ticket Booking System

A full-stack ticket booking platform for movies, concerts, and events. It solves the problem of high-demand events selling out instantly and handling last-minute cancellations via an automated waitlist system.

**Live Application URL:** [https://ticket-booking-system-ashen.vercel.app](https://ticket-booking-system-ashen.vercel.app)

---

## Deliverables Included

1. **Source Code:** Available in this repository.
2. **README:** (This document) Includes setup guide, link to environment variables, and brief explanations.
3. **Hosted URL:** See above.
4. **System Design Write-up:** See [`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md) for the detailed 800-word breakdown of the Seat Hold TTL, Waitlist algorithm, and Concurrency strategies.
5. **API Documentation:** See [`API_DOCS.md`](./API_DOCS.md) for endpoint usage and structures.

---

## Technical Stack
* **Frontend:** React, TypeScript, Tailwind CSS v4, Vite
* **Backend:** Python, FastAPI, asyncpg
* **Database:** PostgreSQL (Event-Sourcing pattern)
* **Auth:** JWT (JSON Web Tokens) with Role-Based Access Control (Customer, Organiser, Admin)
* **Hosting:** Vercel (Frontend), Render (Backend), Supabase (PostgreSQL Database)

---

## Core Logic Summaries

### 1. Seat Hold & TTL Logic
When a customer selects a seat, the system does not simply update a `status = 'HELD'` column. Instead, it inserts an immutable event into a `seat_events` table (e.g. `type='HOLD'`, `expires_at=NOW() + 10 mins`). A dynamic PostgreSQL view (`seat_status_view`) aggregates these events on-the-fly. 

If the 10-minute TTL expires, the `expires_at` condition naturally drops the hold from the view without requiring a polling worker or Cron job to manually update rows. The seat instantly becomes available for others to book.

### 2. Concurrency Protection
To prevent two customers from holding the same seat simultaneously, the hold endpoint wraps the database operation in a transaction and applies an explicit `SELECT ... FOR UPDATE` lock on the specific seat row. If two concurrent requests try to hold the seat, PostgreSQL forces them to execute sequentially, throwing an error for the second request.

### 3. Waitlist & Auto-Assignment Logic
When a seat is cancelled (a `CANCEL` event is logged), a background async task checks the `waitlist_entries` table for the oldest waitlisted user for that specific event and seat category.
If a match is found, the system generates a `waitlist_offers` record with a time-limited expiry (e.g., 2 hours) and sends an email to the waitlisted user. If the user does not claim it within the TTL, the offer expires and the seat is rolled over to the next person in line.

---

## Local Setup Guide

### 1. Prerequisites
* Python 3.10+
* Node.js v18+
* Docker Desktop (for local database)

### 2. Database Setup
Ensure Docker is running, then spin up the local PostgreSQL database:
```bash
docker-compose up -d
```
Initialize the schema:
```bash
docker-compose exec -T postgres psql -U ticket_user -d ticket_booking < server/schema.sql
```
*Note: The raw database schema can be found directly in [`server/schema.sql`](./server/schema.sql)*

### 3. Backend (FastAPI) Setup
Navigate to the `server` directory and set up the Python environment:
```bash
cd server
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```
Set up your environment variables. See [`server/.env.example`](./server/.env.example) for reference:
```bash
cp .env.example .env
```
Start the backend server:
```bash
uvicorn main:app --reload
```
*The API will be available at `http://localhost:8000`. You can view the interactive Swagger docs at `http://localhost:8000/docs`.*

### 4. Frontend (React + Vite) Setup
Open a new terminal window and navigate to the `client` directory:
```bash
cd client
npm install
npm run dev
```
*The frontend will be available at `http://localhost:5173`.*

---

## Testing User Roles
You can register new accounts via the UI, or use the database defaults (if seeded):
- **Admin**: Has full observability and manual venue override control.
- **Organiser**: Can create Venues, dictate seat capacities, and publish new Events.
- **Customer**: Can browse, hold seats, and finalize bookings.
