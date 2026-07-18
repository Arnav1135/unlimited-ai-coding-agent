"use client";

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Send, TerminalSquare, Code, Play } from 'lucide-react';
import { motion } from 'framer-motion';

// Dynamically import Monaco to prevent SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [chatLog, setChatLog] = useState([
    { role: 'agent', content: 'Welcome to your Local Unlimited AI Coding Agent. What shall we build?' }
  ]);
  const terminalRef = useRef<any>(null);

  // Initialize WebSocket using the reverse proxy port 3000
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000/ws");
    
    ws.onopen = () => {
      console.log("Connected to Agent Backend via port 3000.");
    };
    
    return () => ws.close();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setChatLog([...chatLog, { role: 'user', content: prompt }]);
    // We would send this to our FastAPI backend via WebSocket or REST
    setPrompt("");
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 font-sans">
      
      {/* Sidebar / Chat Interface */}
      <div className="w-1/3 flex flex-col border-r border-neutral-800 bg-neutral-900 shadow-xl z-10 relative">
        <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AI Agent Stack
          </h1>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
            Ollama Ready
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatLog.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-xl px-4 py-2 ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-sm' 
                  : 'bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-bl-sm'
              }`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-4 border-t border-neutral-800 bg-neutral-950">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Instruct the agent..." 
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* Main Content Area (Editor / Terminal) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Editor Tabs */}
        <div className="h-10 border-b border-neutral-800 bg-neutral-900 flex items-center px-2 gap-2 text-sm">
          <div className="flex items-center gap-2 bg-neutral-800 px-3 py-1.5 border-t-2 border-blue-500 text-neutral-200 cursor-pointer">
            <Code size={14} className="text-blue-400" />
            <span>main.py</span>
          </div>
          <div className="flex items-center gap-2 hover:bg-neutral-800 px-3 py-1.5 text-neutral-400 cursor-pointer transition-colors">
            <TerminalSquare size={14} />
            <span>Terminal</span>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 bg-[#1e1e1e]">
          <MonacoEditor
            height="100%"
            defaultLanguage="python"
            theme="vs-dark"
            defaultValue="# The agent will write code here autonomously&#10;def hello_agent():&#10;    print('Initializing local intelligence...')&#10;"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              padding: { top: 16 }
            }}
          />
        </div>
        
        {/* Terminal Area (Split Pane) */}
        <div className="h-1/3 border-t border-neutral-800 bg-[#0f111a] flex flex-col">
          <div className="h-8 border-b border-neutral-800 flex items-center px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider bg-neutral-900 justify-between">
            <div className="flex items-center gap-2">
              <TerminalSquare size={12} />
              xterm.js Output
            </div>
            <div className="flex items-center gap-2">
               <button className="hover:text-neutral-200 transition-colors"><Play size={12}/></button>
            </div>
          </div>
          <div className="flex-1 p-4 font-mono text-sm text-neutral-300 overflow-y-auto">
            <p className="text-blue-400">$ agent start --local</p>
            <p className="text-green-400">✓ Connected to FastAPI backend via port 3000</p>
            <p className="text-green-400">✓ Ollama model loaded</p>
            <p className="text-neutral-500 mt-2">Waiting for instructions...</p>
          </div>
        </div>

      </div>
    </div>
  );
}
