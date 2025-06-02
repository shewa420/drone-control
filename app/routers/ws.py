from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List

router = APIRouter()

connected_pis: List[WebSocket] = []
connected_clients: List[WebSocket] = []

allowed_origins = {
    "https://lte-drone-control.onrender.com",
    "https://shewa420-drone-control.onrender.com",
    "http://localhost:8080"
}

@router.websocket("/ws/pi")
async def websocket_endpoint_pi(websocket: WebSocket):
    origin = websocket.headers.get('origin')
    if origin not in allowed_origins:
        print(f"[REJECTED PI] origin: {origin}")
        await websocket.close(code=1008)
        return

    await websocket.accept()
    connected_pis.append(websocket)
    print("[SERVER] Raspberry Pi connected")

    try:
        while True:
            data = await websocket.receive_text()
            print(f"[FROM PI] {data}")
            for client in connected_clients:
                await client.send_text(f"[Telemetry] {data}")
    except WebSocketDisconnect:
        print("[SERVER] Raspberry Pi disconnected")
        connected_pis.remove(websocket)

@router.websocket("/ws/client")
async def websocket_endpoint_client(websocket: WebSocket):
    origin = websocket.headers.get('origin')
    if origin not in allowed_origins:
        print(f"[REJECTED CLIENT] origin: {origin}")
        await websocket.close(code=1008)
        return

    await websocket.accept()
    connected_clients.append(websocket)
    print("[SERVER] Client connected")

    try:
        while True:
            data = await websocket.receive_text()
            print(f"[FROM CLIENT] {data}")
            for pi in connected_pis:
                await pi.send_text(data)
    except WebSocketDisconnect:
        print("[SERVER] Client disconnected")
        connected_clients.remove(websocket)
