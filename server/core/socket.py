import socketio

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio)

@sio.event
async def connect(sid, environ, auth):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.event
async def join_event_room(sid, data):
    event_id = data.get('event_id')
    if event_id:
        sio.enter_room(sid, f"event:{event_id}")

@sio.event
async def seat_hover(sid, data):
    # Lightweight presence indicator, totally anonymous
    event_id = data.get('event_id')
    seat_id = data.get('seat_id')
    
    if event_id and seat_id:
        await sio.emit('seat_presence', {
            'seat_id': seat_id,
            'viewer_count': 1
        }, room=f"event:{event_id}", skip_sid=sid)
