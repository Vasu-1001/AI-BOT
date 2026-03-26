import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  History, 
  Plus, 
  Bot, 
  User, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  BrainCircuit,
  Database,
  Eye,
  MessageSquare,
  Cpu,
  ShieldCheck,
  Sparkles,
  Mic,
  Network
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "./lib/utils";
import { sendMessage, Message, ChatSession } from "./services/geminiService";

const AI_DOMAINS = [
  { name: "Machine Learning", icon: BrainCircuit, color: "text-blue-400" },
  { name: "Deep Learning", icon: Network, color: "text-purple-400" },
  { name: "Data Science", icon: Database, color: "text-emerald-400" },
  { name: "NLP", icon: MessageSquare, color: "text-orange-400" },
  { name: "Computer Vision", icon: Eye, color: "text-pink-400" },
  { name: "Robotics", icon: Cpu, color: "text-yellow-400" },
  { name: "Generative AI", icon: Sparkles, color: "text-cyan-400" },
  { name: "AI Ethics", icon: ShieldCheck, color: "text-red-400" },
  { name: "Speech Recognition", icon: Mic, color: "text-indigo-400" },
];

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ai_interview_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem("ai_interview_sessions", JSON.stringify(sessions));
  }, [sessions]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, currentSessionId]);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Interview Prep",
      messages: [],
      lastUpdated: Date.now(),
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (currentSessionId === id) {
      setCurrentSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    let sessionId = currentSessionId;
    let currentSessions = [...sessions];

    if (!sessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: text.slice(0, 30) + (text.length > 30 ? "..." : ""),
        messages: [],
        lastUpdated: Date.now(),
      };
      currentSessions = [newSession, ...sessions];
      sessionId = newSession.id;
      setSessions(currentSessions);
      setCurrentSessionId(sessionId);
    }

    const userMsg: Message = { role: "user", text, timestamp: Date.now() };
    
    // Update local state immediately
    const updatedSessions = currentSessions.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          messages: [...s.messages, userMsg],
          lastUpdated: Date.now(),
          title: s.messages.length === 0 ? text.slice(0, 30) + (text.length > 30 ? "..." : "") : s.title
        };
      }
      return s;
    });
    setSessions(updatedSessions);
    setInput("");
    setIsLoading(true);

    try {
      const session = updatedSessions.find(s => s.id === sessionId);
      const responseText = await sendMessage(text, session?.messages.slice(0, -1) || []);
      
      const modelMsg: Message = { role: "model", text: responseText, timestamp: Date.now() };
      
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            messages: [...s.messages, modelMsg],
            lastUpdated: Date.now()
          };
        }
        return s;
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0a0a]">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 300 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="glass-panel relative flex flex-col overflow-hidden border-r border-white/10"
      >
        <div className="flex items-center justify-between p-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <History className="h-5 w-5 text-indigo-400" />
            History
          </h2>
          <button
            onClick={createNewSession}
            className="rounded-lg bg-white/5 p-2 transition-colors hover:bg-white/10"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-2">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-500">
              <History className="mb-2 h-8 w-8 opacity-20" />
              <p className="text-sm">No history yet</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setCurrentSessionId(session.id)}
                className={cn(
                  "group relative mb-1 cursor-pointer rounded-xl p-3 transition-all",
                  currentSessionId === session.id
                    ? "bg-indigo-500/20 text-indigo-200"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                )}
              >
                <div className="pr-8 text-sm font-medium truncate">
                  {session.title}
                </div>
                <div className="text-[10px] opacity-50">
                  {new Date(session.lastUpdated).toLocaleDateString()}
                </div>
                <button
                  onClick={(e) => deleteSession(e, session.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 opacity-0 transition-opacity hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-white/5 px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-lg bg-white/5 p-2 transition-colors hover:bg-white/10"
            >
              {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
                <BrainCircuit className="h-5 w-5 text-indigo-400" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white">AI Interview Pro</h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
            <span className="text-xs font-medium text-zinc-400">Expert Mode Active</span>
          </div>
        </header>

        {/* Chat Area */}
        <div className="custom-scrollbar relative flex-1 overflow-y-auto px-4 py-8 md:px-10">
          <AnimatePresence mode="popLayout">
            {!currentSession || currentSession.messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mx-auto flex max-w-3xl flex-col items-center justify-center text-center"
              >
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-500/10 shadow-[0_0_40px_rgba(99,102,241,0.1)]">
                  <Bot className="h-10 w-10 text-indigo-400" />
                </div>
                <h2 className="mb-2 text-3xl font-bold text-white">Master Your AI Interview</h2>
                <p className="mb-10 max-w-md text-zinc-400">
                  I'm specialized in technical AI domains. Ask me anything about ML, DL, CV, or NLP to start your preparation.
                </p>

                <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3">
                  {AI_DOMAINS.map((domain) => (
                    <button
                      key={domain.name}
                      onClick={() => handleSend(`Tell me about common interview questions for ${domain.name}`)}
                      className="glass-panel flex flex-col items-center gap-3 rounded-2xl p-4 transition-all hover:bg-white/10 hover:scale-[1.02] active:scale-95"
                    >
                      <domain.icon className={cn("h-6 w-6", domain.color)} />
                      <span className="text-xs font-semibold text-zinc-300">{domain.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="mx-auto max-w-4xl space-y-6">
                {currentSession.messages.map((msg, idx) => (
                  <motion.div
                    key={msg.timestamp + idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex w-full gap-4",
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      msg.role === "user" ? "bg-zinc-800" : "bg-indigo-500/20"
                    )}>
                      {msg.role === "user" ? <User className="h-5 w-5 text-zinc-400" /> : <Bot className="h-5 w-5 text-indigo-400" />}
                    </div>
                    <div className={cn(
                      "max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed",
                      msg.role === "user" 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                        : "glass-panel text-zinc-200"
                    )}>
                      <div className="markdown-body prose prose-invert max-w-none">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
                      <Bot className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="glass-panel flex items-center gap-2 rounded-2xl px-5 py-3">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.3s]"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.15s]"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400"></span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="border-t border-white/5 bg-[#0a0a0a]/80 p-4 backdrop-blur-md md:p-6">
          <div className="mx-auto max-w-4xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative flex items-center gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about ML architectures, DL backprop, NLP transformers..."
                className="h-14 w-full rounded-2xl bg-white/5 px-6 pr-16 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:bg-white/10 focus:ring-indigo-500/50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white transition-all hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
            <p className="mt-3 text-center text-[10px] text-zinc-500">
              AI Interview Pro is focused on technical AI domains. Non-AI questions will be declined.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
