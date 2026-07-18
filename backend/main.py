from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio

app = FastAPI(title="AI Coding Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "FastAPI backend is running."}

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
