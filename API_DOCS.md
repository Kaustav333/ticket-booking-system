# API Documentation

## Auth
- `POST /api/auth/register` - Register a new user. Body: `{email, password, name, role}`
- `POST /api/auth/login` - Login. Body: `{email, password}` -> Returns JWT.

## Events & Venues
- `GET /api/events` - List all events.
- `GET /api/events/:id/map` - Retrieves the seat map with current `AVAILABLE`, `HELD`, or `CONFIRMED` states derived from the `seat_events` log.

## Booking & Holds
- `POST /api/bookings/hold` - Attempt to hold seats.
  - Body: `{ "event_id": "uuid", "seat_ids": ["uuid1", "uuid2"] }`
  - Transaction: Uses `SELECT FOR UPDATE` to lock all requested seats atomically. Rolls back if any are unavailable.
- `POST /api/bookings/:id/confirm` - Confirm a held booking.
  - Body: `{ "payment_token": "..." }`

## Waitlist
- `POST /api/events/:id/waitlist` - Join the waitlist for a specific category.
- `POST /api/waitlist/claim/:token` - Claim a time-limited waitlist offer. The token is cryptographically hashed and verified transactionally.

## Admin
- `GET /api/admin/metrics` - Retrieves realtime observability metrics derived directly from the event log (e.g. Holds/sec, Active Holds, Waitlist Conversion).

## WebSockets
Connect to `/socket.io`.
- `emit('join_event_room', { event_id })`: Join an event's real-time feed.
- `on('seat_update')`: Receives live availability changes driven by the background sweeper or bookings.
- `emit('seat_hover', { seat_id })`: Broadcasts lightweight presence to other viewers.
