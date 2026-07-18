"use client";

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Send, TerminalSquare, Code, Play, Command, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamically import Monaco to prevent SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [cmdPrompt, setCmdPrompt] = useState("");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [chatLog, setChatLog] = useState([
    { role: 'agent', content: 'Welcome to your Local Unlimited AI Coding Agent. What shall we build?' }
  ]);
  const wsRef = useRef<WebSocket | null>(null);
  const [editorContent, setEditorContent] = useState("# The agent will write code here autonomously\ndef hello_agent():\n    print('Initializing local intelligence...')\n");
  const commandInputRef = useRef<HTMLInputElement>(null);

  // Keyboard listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-focus command palette when opened
  useEffect(() => {
    if (isCommandPaletteOpen && commandInputRef.current) {
      setTimeout(() => commandInputRef.current?.focus(), 100);
    }
  }, [isCommandPaletteOpen]);

  // Initialize WebSocket using the native host port
  useEffect(() => {
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

  const dispatchTask = (taskContent: string) => {
    if (!taskContent.trim()) return;
    setChatLog(prev => [...prev, { role: 'user', content: taskContent }]);
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "start_task", task: taskContent }));
    } else {
      setChatLog(prev => [...prev, { role: 'agent', content: "Error: Not connected to backend." }]);
    }
  };

  const handleSidebarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatchTask(prompt);
    setPrompt("");
  };

  const handleCommandPaletteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatchTask(cmdPrompt);
    setCmdPrompt("");
    setIsCommandPaletteOpen(false);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-blue-200 text-slate-800 font-sans p-4 md:p-6 overflow-hidden relative">
      
      {/* Command Palette Overlay */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsCommandPaletteOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="absolute top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-blue-100 overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                  <Command size={16} className="text-blue-500" />
                  Command Palette
                </div>
                <button onClick={() => setIsCommandPaletteOpen(false)} className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleCommandPaletteSubmit} className="p-6 relative">
                <Sparkles size={24} className="absolute left-10 top-1/2 -translate-y-1/2 text-blue-400" />
                <input 
                  ref={commandInputRef}
                  type="text" 
                  value={cmdPrompt}
                  onChange={(e) => setCmdPrompt(e.target.value)}
                  placeholder="Ask the autonomous agent to build something..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-14 pr-6 py-5 text-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all shadow-inner"
                />
              </form>
              <div className="px-6 pb-4 flex items-center justify-between text-xs text-slate-400">
                <span>Press <kbd className="font-sans bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 mx-1">Enter</kbd> to dispatch</span>
                <span>Press <kbd className="font-sans bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 mx-1">Esc</kbd> to close</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar / Chat Interface */}
      <div className="w-80 lg:w-96 flex flex-col bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/50 mr-4 md:mr-6 shrink-0 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div className="p-6 pb-4 flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-xl font-black text-[#0f172a] tracking-tight flex items-center gap-2">
              <Command size={20} className="text-blue-500"/> AI Agent
            </h1>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#0f172a] bg-blue-100 px-2 py-1 rounded-full shadow-inner border border-blue-200 uppercase tracking-widest cursor-pointer hover:bg-blue-200 transition-colors" onClick={() => setIsCommandPaletteOpen(true)}>
             <span className="opacity-50">Cmd+K</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 relative z-10 scrollbar-hide">
          {chatLog.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-sm' 
                  : 'bg-white text-[#1e293b] border border-blue-100/50 rounded-tl-sm'
              }`}>
                <p className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-4 md:p-6 pt-2 relative z-10">
          <form onSubmit={handleSidebarSubmit} className="flex gap-2 bg-white p-1.5 rounded-full shadow-md border border-blue-100">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Assign a task..." 
              className="flex-1 bg-transparent px-4 py-2 text-sm text-[#0f172a] font-medium placeholder:text-slate-400 focus:outline-none"
            />
            <button 
              type="submit" 
              className="bg-[#0f172a] hover:bg-blue-600 text-white p-2.5 rounded-full transition-all active:scale-95 flex items-center justify-center shadow-md"
            >
              <Send size={14} className="ml-0.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Main Content Area (Editor / Terminal) */}
      <div className="flex-1 flex flex-col gap-4 md:gap-6 min-w-0">
        
        {/* Editor Area */}
        <div className="flex-[3] min-h-0 bg-[#0f172a] rounded-[2rem] shadow-xl overflow-hidden flex flex-col border border-slate-700/50">
          <div className="h-12 bg-[#1e293b]/50 border-b border-slate-700/50 flex items-center px-4 justify-between">
            <div className="flex gap-4 items-center">
              <div className="flex gap-1.5">
                 <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                 <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                 <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg">
                <Code className="text-blue-400" size={14} />
                <span className="text-xs text-blue-100 font-mono">main.py</span>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 relative">
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
                wordWrap: "on"
              }}
            />
          </div>
        </div>
        
        {/* Terminal Area */}
        <div className="flex-1 min-h-[150px] shrink-0 bg-white/70 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-lg flex flex-col overflow-hidden">
          <div className="h-10 border-b border-blue-100/50 flex items-center px-6 justify-between bg-white/50">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0f172a] uppercase tracking-wider">
              <TerminalSquare size={14} className="text-blue-500" />
              Terminal Output
            </div>
            <button className="text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-md transition-colors">
               <Play size={12} fill="currentColor"/>
            </button>
          </div>
          <div className="flex-1 p-4 px-6 font-mono text-xs text-slate-700 overflow-y-auto">
            <p className="text-blue-600 font-semibold">$ agent start --local</p>
            <p className="text-emerald-600 flex items-center gap-2 mt-1">
               <span className="h-1 w-1 rounded-full bg-emerald-500"></span>
               Connected to FastAPI backend
            </p>
            <p className="text-emerald-600 flex items-center gap-2 mt-1">
               <span className="h-1 w-1 rounded-full bg-emerald-500"></span>
               Ollama model loaded
            </p>
            <p className="text-slate-400 mt-2 animate-pulse">Waiting for commands...</p>
          </div>
        </div>

      </div>
    </div>
  );
}
