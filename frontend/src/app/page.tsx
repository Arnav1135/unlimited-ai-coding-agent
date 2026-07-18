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
  const wsRef = useRef<WebSocket | null>(null);
  const [editorContent, setEditorContent] = useState("# The agent will write code here autonomously\ndef hello_agent():\n    print('Initializing local intelligence...')\n");

  // Initialize WebSocket using the native host port
  useEffect(() => {
    // dynamically grab host (localhost:3000 usually)
    const host = window.location.host;
    const ws = new WebSocket(`ws://${host}/ws`);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log(`Connected to Agent Backend via ${host}.`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "plan" || data.type === "info") {
          setChatLog(prev => [...prev, { role: 'agent', content: data.message }]);
        } else if (data.type === "success") {
          setChatLog(prev => [...prev, { role: 'agent', content: `Success: ${data.message}` }]);
        } else if (data.type === "error") {
          setChatLog(prev => [...prev, { role: 'agent', content: `Error: ${data.message}` }]);
        } else if (data.type === "code") {
           setEditorContent(data.code);
        }
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };
    
    return () => ws.close();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setChatLog([...chatLog, { role: 'user', content: prompt }]);
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "start_task", task: prompt }));
    } else {
      setChatLog(prev => [...prev, { role: 'agent', content: "Error: Not connected to backend." }]);
    }
    
    setPrompt("");
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-blue-200 text-slate-800 font-sans p-6 overflow-hidden">
      
      {/* Sidebar / Chat Interface */}
      <div className="w-1/3 flex flex-col bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/50 mr-6 overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>

        <div className="p-8 pb-4 flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-2xl font-black text-[#0f172a] tracking-tight">AI Agent</h1>
            <p className="text-xs font-semibold text-blue-500 mt-1 uppercase tracking-wider">Workspace</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0f172a] bg-blue-100 px-3 py-1.5 rounded-full shadow-inner border border-blue-200">
            <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></span>
            Ready
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 relative z-10">
          {chatLog.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-3xl px-5 py-3 shadow-md ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-sm' 
                  : 'bg-white text-[#1e293b] border border-blue-100 rounded-tl-sm'
              }`}>
                <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-6 pt-4 relative z-10">
          <form onSubmit={handleSubmit} className="flex gap-3 bg-white p-2 rounded-[2rem] shadow-lg border border-blue-100">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Assign a task..." 
              className="flex-1 bg-transparent px-4 py-2 text-sm text-[#0f172a] font-medium placeholder:text-slate-400 focus:outline-none"
            />
            <button 
              type="submit" 
              className="bg-[#0f172a] hover:bg-[#1e293b] text-white p-3 rounded-full transition-transform active:scale-95 flex items-center justify-center shadow-md"
            >
              <Send size={16} className="ml-1" />
            </button>
          </form>
        </div>
      </div>

      {/* Main Content Area (Editor / Terminal) */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        
        {/* Top Cards (Stats/Info Mockup to match theme) */}
        <div className="flex gap-4">
          <div className="flex-1 bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-48 h-48 border border-white/10 rounded-full translate-x-1/4 -translate-y-1/4"></div>
             <div className="absolute bottom-0 right-10 w-32 h-32 border border-white/10 rounded-full translate-y-1/2"></div>
             <div className="relative z-10 flex justify-between items-center">
                <Code className="text-blue-400" size={24} />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-lg backdrop-blur-md">Python</span>
             </div>
             <div className="relative z-10 mt-6">
                <p className="text-sm text-blue-200 mb-1">Active File</p>
                <h3 className="text-xl font-bold tracking-wide">main.py</h3>
             </div>
          </div>
          <div className="flex-1 bg-gradient-to-br from-blue-400 to-blue-500 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
             <div className="relative z-10 flex justify-between items-center">
                <TerminalSquare className="text-blue-100" size={24} />
                <span className="text-xs bg-black/10 px-2 py-1 rounded-lg backdrop-blur-md">Output</span>
             </div>
             <div className="relative z-10 mt-6">
                <p className="text-sm text-blue-100 mb-1">Status</p>
                <h3 className="text-xl font-bold tracking-wide">Ready for Code</h3>
             </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-[2] bg-[#0f172a] rounded-[2rem] shadow-xl overflow-hidden flex flex-col border border-slate-700/50">
          <div className="h-10 bg-[#1e293b]/50 border-b border-slate-700/50 flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
               <div className="w-3 h-3 rounded-full bg-rose-500"></div>
               <div className="w-3 h-3 rounded-full bg-amber-500"></div>
               <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            </div>
            <span className="text-xs text-slate-400 font-mono ml-2">main.py</span>
          </div>
          <div className="flex-1">
            <MonacoEditor
              height="100%"
              defaultLanguage="python"
              theme="vs-dark"
              value={editorContent}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                padding: { top: 16 },
                roundedSelection: true,
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>
        
        {/* Terminal Area */}
        <div className="flex-1 bg-white/70 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-lg flex flex-col overflow-hidden">
          <div className="h-12 border-b border-blue-100 flex items-center px-6 justify-between bg-white/50">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0f172a]">
              <TerminalSquare size={16} className="text-blue-500" />
              Terminal Output
            </div>
            <button className="text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-full transition-colors">
               <Play size={14} fill="currentColor"/>
            </button>
          </div>
          <div className="flex-1 p-6 font-mono text-sm text-slate-700 overflow-y-auto">
            <p className="text-blue-600 font-semibold">$ agent start --local</p>
            <p className="text-emerald-600 flex items-center gap-2 mt-1">
               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
               Connected to FastAPI backend
            </p>
            <p className="text-emerald-600 flex items-center gap-2 mt-1">
               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
               Ollama model loaded
            </p>
            <p className="text-slate-400 mt-3 animate-pulse">Waiting for instructions...</p>
          </div>
        </div>

      </div>
    </div>
  );
}
