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
    <div className="flex h-screen bg-gradient-to-br from-[#dbeafe] to-[#f0f9ff] text-slate-800 font-sans p-4 md:p-6 overflow-hidden relative">
      
      {/* Command Palette Overlay */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-[#0f172a]/20 backdrop-blur-sm"
              onClick={() => setIsCommandPaletteOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="absolute top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl bg-white rounded-3xl shadow-[0_30px_60px_rgba(11,28,64,0.1)] border border-blue-100/50 overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-blue-50 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3 text-[#0b1c40] font-bold text-sm tracking-wide">
                  <div className="bg-[#e0f2fe] p-1.5 rounded-lg">
                    <Command size={18} className="text-[#2b88ea]" />
                  </div>
                  Command Palette
                </div>
                <button onClick={() => setIsCommandPaletteOpen(false)} className="p-2 hover:bg-[#f0f9ff] rounded-full text-slate-400 hover:text-[#0b1c40] transition-colors">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCommandPaletteSubmit} className="p-6 relative">
                <Sparkles size={24} className="absolute left-10 top-1/2 -translate-y-1/2 text-[#2b88ea]" />
                <input 
                  ref={commandInputRef}
                  type="text" 
                  value={cmdPrompt}
                  onChange={(e) => setCmdPrompt(e.target.value)}
                  placeholder="Ask the agent to build something..." 
                  className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-2xl pl-16 pr-6 py-5 text-lg text-[#0b1c40] font-medium focus:outline-none focus:ring-4 focus:ring-[#2b88ea]/10 focus:border-[#2b88ea] transition-all shadow-inner placeholder:text-slate-400"
                />
              </form>
              <div className="px-8 pb-6 flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Press <kbd className="font-sans bg-white border border-slate-200 shadow-sm px-2 py-1 rounded-md text-slate-500 mx-1">Enter</kbd> to dispatch</span>
                <span>Press <kbd className="font-sans bg-white border border-slate-200 shadow-sm px-2 py-1 rounded-md text-slate-500 mx-1">Esc</kbd> to close</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar / Chat Interface */}
      <div className="w-80 lg:w-96 flex flex-col bg-[#ffffff] backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(11,28,64,0.05)] border border-white mr-4 md:mr-6 shrink-0 relative overflow-hidden">
        
        <div className="p-6 pb-4 flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-xl font-bold text-[#0b1c40] tracking-tight flex items-center gap-3">
              <div className="bg-[#2b88ea] text-white p-2 rounded-xl shadow-lg shadow-[#2b88ea]/30">
                <Command size={20} />
              </div>
              AI Agent
            </h1>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#2b88ea] bg-[#f0f9ff] px-3 py-1.5 rounded-full shadow-inner border border-[#e0f2fe] uppercase tracking-widest cursor-pointer hover:bg-[#e0f2fe] transition-colors" onClick={() => setIsCommandPaletteOpen(true)}>
             <span className="opacity-80">Cmd+K</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 relative z-10 scrollbar-hide">
          {chatLog.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[90%] rounded-2xl px-5 py-3.5 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-[#2b88ea] to-[#1d6bbf] text-white rounded-tr-md shadow-lg shadow-[#2b88ea]/20' 
                  : 'bg-[#f8fafc] text-[#0b1c40] border border-slate-100 rounded-tl-md'
              }`}>
                <p className="text-[14px] font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-4 md:p-6 relative z-10 bg-gradient-to-t from-white via-white to-transparent pt-8">
          <form onSubmit={handleSidebarSubmit} className="flex gap-2 bg-[#f8fafc] p-2 rounded-[2rem] shadow-sm border border-slate-200 focus-within:border-[#2b88ea] focus-within:ring-2 focus-within:ring-[#2b88ea]/20 transition-all">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Assign a task..." 
              className="flex-1 bg-transparent px-4 py-2 text-sm text-[#0b1c40] font-semibold placeholder:text-slate-400 placeholder:font-medium focus:outline-none"
            />
            <button 
              type="submit" 
              className="bg-[#0b1c40] hover:bg-[#1a2e5a] text-white p-3 rounded-full transition-all active:scale-95 flex items-center justify-center shadow-md shadow-[#0b1c40]/20"
            >
              <Send size={16} className="ml-0.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Main Content Area (Editor / Terminal) */}
      <div className="flex-1 flex flex-col gap-4 md:gap-6 min-w-0">
        
        {/* Editor Area */}
        <div className="flex-[3] min-h-0 bg-[#ffffff] rounded-[2.5rem] shadow-[0_20px_50px_rgba(11,28,64,0.05)] overflow-hidden flex flex-col border border-white">
          <div className="h-16 bg-[#f8fafc] border-b border-slate-100 flex items-center px-6 justify-between">
            <div className="flex gap-6 items-center">
              <div className="flex gap-2">
                 <div className="w-3.5 h-3.5 rounded-full bg-slate-300"></div>
                 <div className="w-3.5 h-3.5 rounded-full bg-slate-300"></div>
                 <div className="w-3.5 h-3.5 rounded-full bg-slate-300"></div>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                <Code className="text-[#2b88ea]" size={16} />
                <span className="text-sm text-[#0b1c40] font-bold font-sans tracking-wide">main.py</span>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 relative bg-white">
            <MonacoEditor
              height="100%"
              defaultLanguage="python"
              theme="light"
              value={editorContent}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                padding: { top: 24, bottom: 24 },
                roundedSelection: true,
                scrollBeyondLastLine: false,
                wordWrap: "on",
                lineNumbersMinChars: 3,
                lineDecorationsWidth: 16
              }}
            />
          </div>
        </div>
        
        {/* Terminal Area */}
        <div className="flex-1 min-h-[180px] shrink-0 bg-[#0b1c40] rounded-[2.5rem] shadow-[0_20px_50px_rgba(11,28,64,0.15)] flex flex-col overflow-hidden relative border border-[#1a2e5a]">
          {/* Subtle curved background lines similar to image card */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] border-[1px] border-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] border-[1px] border-white/5 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

          <div className="h-14 border-b border-white/10 flex items-center px-6 justify-between bg-white/5 relative z-10 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest">
              <TerminalSquare size={16} className="text-[#2b88ea]" />
              Terminal Output
            </div>
            <button className="text-white hover:text-white bg-[#2b88ea] hover:bg-[#1d6bbf] p-2 rounded-xl transition-colors shadow-md">
               <Play size={14} fill="currentColor"/>
            </button>
          </div>
          <div className="flex-1 p-5 px-6 font-mono text-[13px] text-slate-300 overflow-y-auto relative z-10 leading-relaxed">
            <p className="text-[#60a5fa] font-semibold mb-2">$ agent start --local</p>
            <p className="text-[#34d399] flex items-center gap-2 mt-1">
               <span className="h-1.5 w-1.5 rounded-full bg-[#34d399] shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
               Connected to FastAPI backend
            </p>
            <p className="text-[#34d399] flex items-center gap-2 mt-1">
               <span className="h-1.5 w-1.5 rounded-full bg-[#34d399] shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
               Ollama model loaded
            </p>
            <p className="text-slate-400 mt-4 animate-pulse flex items-center gap-2">
               <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
               Waiting for commands...
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
