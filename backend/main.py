from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import json
import asyncio
import os

app = FastAPI(title="AI Coding Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "start_task":
                task = message.get("task")
                await websocket.send_json({"type": "info", "message": f"Received task: {task}"})
                
                # Run the LangGraph agent
                await websocket.send_json({"type": "plan", "message": "Initiating LangGraph Agent Workflow..."})
                
                from agent.graph import app as agent_app
                
                # Simulate streaming node progress
                final_state = agent_app.invoke({"task": task, "iterations": 0})
                
                if final_state.get("error"):
                    await websocket.send_json({"type": "error", "message": f"Task failed after retries: {final_state['error']}"})
                else:
                    await websocket.send_json({"type": "code", "code": final_state.get("code", "")})
                    await websocket.send_json({"type": "success", "message": "Task completed and verified successfully."})
                
    except WebSocketDisconnect:
        print("Client disconnected")

# Serve the static Next.js frontend export
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "out")
if os.path.isdir(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
else:
    @app.get("/")
    def read_root():
        return {"status": "error", "message": "Frontend static export not found. Run 'npm run build' in frontend folder."}
