CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE role_enum AS ENUM ('customer', 'organiser', 'admin');
CREATE TYPE seat_event_type AS ENUM ('HOLD', 'RELEASE', 'EXPIRE', 'CONFIRM', 'CANCEL', 'WAITLIST_JOIN', 'WAITLIST_OFFER', 'WAITLIST_CLAIM', 'WAITLIST_OFFER_EXPIRE');
CREATE TYPE booking_status AS ENUM ('HELD', 'CONFIRMED', 'CANCELLED');
CREATE TYPE waitlist_status AS ENUM ('WAITING', 'OFFERED', 'CLAIMED', 'EXPIRED', 'CANCELLED');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    role role_enum DEFAULT 'customer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    location VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE venue_layouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    section VARCHAR NOT NULL,
    row_identifier VARCHAR NOT NULL,
    seat_identifier VARCHAR NOT NULL,
    default_category VARCHAR,
    coordinate_x DECIMAL,
    coordinate_y DECIMAL
);

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organiser_id UUID REFERENCES users(id),
    venue_id UUID REFERENCES venues(id),
    title VARCHAR NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    payment_details VARCHAR,
    payment_qr_url VARCHAR,
    thumbnail_url VARCHAR,
    average_rating DECIMAL(3,1),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_events_organiser ON events(organiser_id);

CREATE TABLE event_seat_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    category_id UUID REFERENCES event_seat_categories(id),
    section VARCHAR NOT NULL,
    row_identifier VARCHAR NOT NULL,
    seat_identifier VARCHAR NOT NULL,
    coordinate_x DECIMAL,
    coordinate_y DECIMAL
);
CREATE INDEX idx_seats_event_category ON seats(event_id, category_id);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    event_id UUID REFERENCES events(id),
    booking_reference VARCHAR UNIQUE NOT NULL,
    status booking_status NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_bookings_user_event ON bookings(user_id, event_id);

CREATE TABLE booking_seats (
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id UUID REFERENCES seats(id),
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR NOT NULL,
    PRIMARY KEY (booking_id, seat_id)
);

CREATE TABLE seat_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seat_id UUID REFERENCES seats(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id),
    user_id UUID REFERENCES users(id),
    event_type seat_event_type NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);
CREATE INDEX idx_seat_events_seat_time ON seat_events(seat_id, timestamp DESC);
CREATE INDEX idx_seat_events_type_expires ON seat_events(event_type, expires_at);

CREATE OR REPLACE VIEW seat_status_view AS
SELECT DISTINCT ON (seat_id)
    seat_id,
    event_type AS status,
    booking_id,
    user_id,
    timestamp,
    expires_at
FROM seat_events
ORDER BY seat_id, timestamp DESC;

CREATE TABLE waitlist_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    category_id UUID REFERENCES event_seat_categories(id),
    user_id UUID REFERENCES users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    status waitlist_status DEFAULT 'WAITING',
    expired_offers_count INT DEFAULT 0
);
CREATE INDEX idx_waitlist_lookup ON waitlist_entries(event_id, category_id, status);

CREATE TABLE waitlist_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    waitlist_entry_id UUID REFERENCES waitlist_entries(id) ON DELETE CASCADE,
    seat_id UUID REFERENCES seats(id),
    token_hash VARCHAR UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    claimed_at TIMESTAMPTZ
);
CREATE INDEX idx_waitlist_offers_token ON waitlist_offers(token_hash);
