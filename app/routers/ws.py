from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List

router = APIRouter()

connected_pis: List[WebSocket] = []  # клиенты от Raspberry Pi
connected_clients: List[WebSocket] = []  # браузеры

@router.websocket("/ws/pi")
async def websocket_endpoint_pi(websocket: WebSocket):
    await websocket.accept()
    connected_pis.append(websocket)
    print("[SERVER] Raspberry Pi connected")

    try:
        while True:
            data = await websocket.receive_text()
            print(f"[FROM PI] {data}")

            # Тест: рассылаем сообщение всем клиентам браузера
            for client in connected_clients:
                await client.send_text(f"[Telemetry] {data}")

    except WebSocketDisconnect:
        print("[SERVER] Raspberry Pi disconnected")
        connected_pis.remove(websocket)


@router.websocket("/ws/client")
async def websocket_endpoint_client(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    print("[SERVER] Client connected")

    try:
        while True:
            data = await websocket.receive_text()
            print(f"[FROM CLIENT] {data}")

            # Отправляем всем Raspberry Pi
            for pi in connected_pis:
                await pi.send_text(data)

    except WebSocketDisconnect:
        print("[SERVER] Client disconnected")
        connected_clients.remove(websocket)
