from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws/pi")
async def websocket_pi(websocket: WebSocket):
    await websocket.accept()
    print("[TEST] Raspberry Pi connected")

    try:
        while True:
            data = await websocket.receive_text()
            print(f"[TEST] Received from Pi: {data}")
            await websocket.send_text(f"Echo: {data}")
    except Exception as e:
        print(f"[TEST] WebSocket error: {e}")
        await websocket.close()
