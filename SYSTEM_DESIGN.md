# System Design: Event-Sourced Ticket Booking Architecture

## 1. Event-Sourcing vs Redis-based Approaches
A traditional approach to ticket holding uses Redis to cache temporary reservations (e.g., setting a key `hold:seat:1A` with a 10-minute TTL). While performant, it suffers from split-brain scenarios and data fragmentation—the truth of a seat's state is scattered between the cache (holds) and the database (confirmed bookings).

This system deliberately abandons Redis, adopting an **event-sourced** architecture within PostgreSQL as the single source of truth. Every transition (HOLD, EXPIRE, CONFIRM, CANCEL) is logged immutably in the `seat_events` table. The current state of any seat is deterministically derived from its latest event.

**Why this was chosen:**
- **Absolute Consistency:** Holds and bookings share the same transaction boundary. 
- **Time Travel & Observability:** We have an exact historical audit log of every interaction. Admin metrics (conflict rates, exact hold durations) are trivially queried from this log without requiring separate analytics telemetry.
- **Idempotency:** Re-processing expirations or resolving conflicts is predictable because the state machine is strictly forward-moving.

## 2. Concurrency Prevention Mechanism
The most critical failure point in ticketing is double-booking. When a user attempts to hold a seat, the system executes an atomic transaction utilizing PostgreSQL row-level locking:

```sql
SELECT id FROM seats WHERE id = ANY($1) FOR UPDATE;
```

This guarantees that two simultaneous hold requests for the same seat(s) will be serialized by the database engine.
1. User A acquires the lock, verifies the seat is `AVAILABLE` via the derived `seat_status_view`, writes the `HOLD` event, and commits.
2. User B, who was queued by PostgreSQL waiting for the lock, is then granted the lock. User B's transaction reads the updated `seat_status_view`, sees the seat is now `HELD`, and immediately rolls back, receiving a clear "409 Conflict" response.

This ensures zero silent failures and zero phantom holds, even under extreme load. Multi-seat holds are entirely atomic—if 4 out of 5 seats are available, the transaction rolls back, leaving no partial holds.

## 3. Waitlist Priority Algorithm
Traditional FIFO waitlists are often blocked by unresponsive users at the top of the queue. To counter this, the waitlist allocates seats using a **Priority Score** formula that penalizes "no-shows" (users who let previous waitlist offers expire).

`Priority Score = joined_at_epoch_ms + (expired_offers_count * penalty_weight_ms)`

By incrementing the `expired_offers_count` when an offer expires, the system artificially pushes the unresponsive user back in the queue (e.g., adding 24 hours to their join time). This ensures deterministic fairness—highly responsive users naturally bubble up, while unresponsive users are degraded without being entirely banned. This metric is strictly scoped to the specific event and category to maintain contextual fairness.

## 4. Time-Limited Offer Handling
Waitlist allocations trigger a `WAITLIST_OFFER` event in the seat's history, effectively reserving it with a strict 15-minute TTL. The user receives a cryptographically secure, random hash token to claim the seat.

A background Python `APScheduler` job runs every 5 seconds to sweep the database for expired holds and offers. It uses `SELECT ... FOR UPDATE SKIP LOCKED` to safely identify expired rows across distributed worker nodes, updates their status to `EXPIRED`, increments the user's `expired_offers_count`, and triggers a new offer generation for the next highest-priority user. The claim endpoint securely validates the token hash and atomic state before converting the offer into a `CONFIRM` event.
