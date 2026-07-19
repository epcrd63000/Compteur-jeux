from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import os
import json

app = FastAPI()

html_path = os.path.join(os.path.dirname(__file__), "index.html")

# In-memory state of the game
game_state = {
    "gameMode": "menu",
    "players": [{ "id": 1, "name": "Joueur 1", "score": 0 }],
    "currentTurn": 0
}

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        # Send current state to new client
        await websocket.send_text(json.dumps({"type": "sync", "data": game_state}))

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str, sender: WebSocket = None):
        for connection in self.active_connections:
            if connection != sender:
                try:
                    await connection.send_text(message)
                except:
                    pass

manager = ConnectionManager()

@app.get("/")
async def get():
    with open(html_path, "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())

from fastapi.responses import FileResponse

@app.get("/manifest.json")
async def get_manifest():
    return FileResponse(os.path.join(os.path.dirname(__file__), "manifest.json"))

@app.get("/icon.png")
async def get_icon():
    return FileResponse(os.path.join(os.path.dirname(__file__), "icon.png"))

@app.get("/sw.js")
async def get_sw():
    return FileResponse(os.path.join(os.path.dirname(__file__), "sw.js"))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    global game_state
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            if msg.get("type") == "update":
                game_state = msg.get("data")
                # Broadcast new state to everyone else
                await manager.broadcast(json.dumps({"type": "sync", "data": game_state}), sender=websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
