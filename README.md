# Unlimited AI Coding Agent Stack

An open-source, fully local, self-hosted AI software engineering partner. 
This stack runs entirely on your own machine, meaning **zero API costs, absolute data privacy, and unlimited usage**. 

Under the hood, it leverages Ollama for local LLM inference, LangGraph for cyclic agent reasoning (including an autonomous Error Engine), and a Next.js frontend featuring Monaco Editor and xterm.js for a premium IDE experience.

## Features
- **100% Free & Local**: No OpenAI or Anthropic API keys required.
- **Error Engine**: Built-in self-correction loop. If the agent writes failing code, it parses the stack trace and patches it automatically.
- **Local Memory**: Persists conversation history and massive codebase context to disk using PostgreSQL and ChromaDB, keeping your active RAM usage low.
- **IDE Interface**: Sleek dark-mode Next.js dashboard with a built-in code editor and terminal.

## Prerequisites
Before starting the stack, ensure you have the following installed:
1. **Docker Desktop** (or Podman) - required for Postgres, Redis, and ChromaDB.
2. **Python 3.10+** - required for the FastAPI backend.
3. **Node.js (v18+)** - required for the Next.js frontend.
4. **Ollama** - Download from [ollama.com](https://ollama.com/) and run a model (e.g., `ollama run qwen2.5-coder`).

## Quick Start

### 1. Configure Storage
By default, the agent saves databases to a local folder. You can configure this in the `.env` file located in the root directory:
```env
AGENT_STORAGE_PATH=D:\AgentWorkspace
```

### 2. Start the Stack
For **Windows**, simply double click or run:
```cmd
start.bat
```

For **Mac/Linux**, run:
```bash
chmod +x start.sh
./start.sh
```

### 3. Access the Agent
Once the startup script finishes:
- Open your browser to **http://localhost:3000** for the UI.
- The backend API runs on **http://localhost:8000**.

## Architecture
- **Frontend**: Next.js 15, React, Tailwind CSS, Monaco Editor, xterm.js
- **Backend**: Python, FastAPI, LangGraph, Ollama
- **Infrastructure**: Docker, PostgreSQL (Relational Memory), Redis (Cache), ChromaDB (Vector DB for RAG)

## License
MIT License - Free to use, modify, and distribute.
