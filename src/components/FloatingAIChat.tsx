import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { calculateCGPA } from '../utils/gpa';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { MessageCircle, Send, Loader2, Sparkles, Plus, X, ChevronLeft, ChevronRight, History, Trash2 } from 'lucide-react';
import { ChatSession, ChatMessage } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function FloatingAIChat() {
  const { user, profile } = useAuth();
  const { semesters, courses } = useData();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isVisible = ['/dashboard', '/semesters'].some(path => location.pathname.startsWith(path));

  // Load chat sessions
  useEffect(() => {
    if (!user || !isOpen || !isVisible) return;
    
    const fetchSessions = async () => {
      try {
        const q = query(
          collection(db, 'chat_sessions'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const loadedSessions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ChatSession[];
        
        loadedSessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        
        setSessions(loadedSessions);
        if (loadedSessions.length > 0 && !activeSessionId) {
          setActiveSessionId(loadedSessions[0].id);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };

    fetchSessions();
  }, [user, isOpen, activeSessionId, isVisible]);

  // Load messages for active session
  useEffect(() => {
    if (!activeSessionId || !isOpen || !isVisible) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const q = query(
          collection(db, 'chat_messages'),
          where('chatId', '==', activeSessionId),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const loadedMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ChatMessage[];
        
        loadedMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        setMessages(loadedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [activeSessionId, isOpen, isVisible]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const createNewSession = async () => {
    if (!user) return;
    try {
      const newSessionData = {
        userId: user.uid,
        title: 'New Chat',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'chat_sessions'), newSessionData);
      const newSession = { id: docRef.id, ...newSessionData } as ChatSession;
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setShowHistory(false);
      setMessages([]);
    } catch (error) {
      console.error("Error creating session", error);
    }
  };

  const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'chat_sessions', sessionId));
      
      // Also delete messages for this session
      const q = query(
        collection(db, 'chat_messages'), 
        where('chatId', '==', sessionId),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      snapshot.forEach(async (msgDoc) => {
        await deleteDoc(doc(db, 'chat_messages', msgDoc.id));
      });

      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(remainingSessions);
      if (activeSessionId === sessionId) {
        setActiveSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user) return;

    let currentSessionId = activeSessionId;
    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Create session if none exists
      if (!currentSessionId) {
        const newSessionData = {
          userId: user.uid,
          title: 'New Chat',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, 'chat_sessions'), newSessionData);
        const newSession = { id: docRef.id, ...newSessionData } as ChatSession;
        currentSessionId = newSession.id;
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(currentSessionId);
      }

      // Optimistically add user message to UI
      const tempUserMsg: ChatMessage = {
        id: Date.now().toString(),
        chatId: currentSessionId!,
        userId: user.uid,
        role: 'user',
        content: userMessage,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempUserMsg]);

      // Save user message to DB
      const userMsgData = {
        chatId: currentSessionId!,
        userId: user.uid,
        role: 'user',
        content: userMessage,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'chat_messages'), userMsgData);
      await updateDoc(doc(db, 'chat_sessions', currentSessionId!), { updatedAt: new Date().toISOString() });

      // Prepare history for Gemini
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const cgpa = calculateCGPA(semesters, courses);
      const totalUnits = courses.reduce((acc, c) => acc + c.units, 0);
      
      const context = `
        You are GradePro AI, a comprehensive Study Assistant and academic tutor.
        The student's name is ${profile?.displayName || 'Student'}.
        They are a ${profile?.level || ''} student in the ${profile?.department || ''} department at ${profile?.institution || ''}.
        
        Your primary goal is to help the user learn, understand concepts deeply, and succeed academically. 
        
        IMPORTANT RULES:
        1. DIRECT ANSWER FIRST: Always provide a direct, concise answer to the user's question at the very beginning of your response.
        2. EXPLAIN LATER: After the direct answer, provide a detailed explanation to help the user understand the concept deeply.
        3. FOCUS ON LEARNING: Ensure the user truly understands the solutions you provide.
        4. NO CGPA FOCUS: DO NOT mention or focus on their CGPA unless the user explicitly asks about it.
        5. FORMATTING: Use markdown for readability.
        6. LENGTH: You are encouraged to provide thorough explanations. Do not be overly brief after the initial direct answer.
        
        [Optional Context if they ask about grades]
        Current CGPA: ${cgpa} / ${profile?.gradingScale || 5.0}
        Target CGPA: ${profile?.targetCGPA || 4.5}
        Total Units: ${totalUnits}
        Recent academic data:
        ${semesters.map(s => {
          const sCourses = courses.filter(c => c.semesterId === s.id);
          return `Semester: ${s.name} (${s.level}) - Courses: ${sCourses.map(c => `${c.code} (${c.grade})`).join(', ')}`;
        }).join('\n')}
      `;

      const historyContents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      
      historyContents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });

      // Get AI response
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: historyContents,
        config: {
          systemInstruction: context,
          maxOutputTokens: 2048,
        }
      });
      
      const aiResponse = response.text || 'I am not sure how to respond to that.';

      // Save AI message to DB
      const aiMsgData = {
        chatId: currentSessionId!,
        userId: user.uid,
        role: 'assistant',
        content: aiResponse,
        createdAt: new Date().toISOString()
      };
      const aiMsgRef = await addDoc(collection(db, 'chat_messages'), aiMsgData);
      const newAiMsg = { id: aiMsgRef.id, ...aiMsgData } as ChatMessage;
      setMessages(prev => [...prev, newAiMsg]);

      // Update session title if it's still "New Chat"
      const session = sessions.find(s => s.id === currentSessionId);
      if (session && (session.title === 'New Chat' || messages.length === 0)) {
        const titleResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [{ role: 'user', parts: [{ text: `Generate a very short, 3-5 word title for a chat that starts with this question: "${userMessage}". Output ONLY the title.` }] }]
        });
        const newTitle = titleResponse.text?.trim().replace(/^"|"$/g, '') || userMessage.substring(0, 30);
        
        await updateDoc(doc(db, 'chat_sessions', currentSessionId!), { title: newTitle });
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: newTitle } : s));
      }

    } catch (error) {
      console.error('AI Error:', error);
      if (currentSessionId) {
        const errorMsg = 'Sorry, I encountered an error. Please try again later.';
        const errData = {
          chatId: currentSessionId!,
          userId: user.uid,
          role: 'assistant',
          content: errorMsg,
          createdAt: new Date().toISOString()
        };
        const errRef = await addDoc(collection(db, 'chat_messages'), errData);
        const newErrMsg = { id: errRef.id, ...errData } as ChatMessage;
        setMessages(prev => [...prev, newErrMsg]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              width: windowWidth < 768 ? '90vw' : (showHistory ? (isHistoryCollapsed ? '464px' : '640px') : '400px')
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[90vw] h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300"
          >
            {/* Header */}
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span className="font-bold">GradePro AI</span>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={createNewSession}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors flex items-center space-x-1"
                  title="New Chat"
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-xs font-medium hidden sm:inline">New Chat</span>
                </button>
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  title="Chat History"
                >
                  <History className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
              {/* History Sidebar */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ 
                      width: isHistoryCollapsed ? 64 : 240, 
                      opacity: 1 
                    }}
                    exit={{ width: 0, opacity: 0 }}
                    className="h-full bg-slate-50 border-r border-slate-200 flex flex-col relative transition-all duration-300 ease-in-out"
                  >
                    {/* Collapse Toggle Button */}
                    <button
                      onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
                      className="absolute -right-3 top-4 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-indigo-600 shadow-sm z-20"
                    >
                      {isHistoryCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                    </button>

                    <div className={`p-4 border-b border-slate-200 flex items-center bg-white ${isHistoryCollapsed ? 'justify-center' : 'justify-between'}`}>
                      {!isHistoryCollapsed && <h3 className="font-bold text-slate-800 text-sm">History</h3>}
                      {isHistoryCollapsed && <History className="h-4 w-4 text-slate-400" />}
                    </div>
                    <div className="p-2 border-b border-slate-200">
                      <button
                        onClick={createNewSession}
                        title={isHistoryCollapsed ? 'New Chat' : ''}
                        className={`w-full flex items-center justify-center space-x-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors ${isHistoryCollapsed ? 'p-2' : 'px-3 py-2'}`}
                      >
                        <Plus className="h-4 w-4" />
                        {!isHistoryCollapsed && <span className="text-xs font-medium">New Chat</span>}
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {sessions.map(session => (
                        <div key={session.id} className="relative group">
                          <button
                            onClick={() => {
                              setActiveSessionId(session.id);
                              if (window.innerWidth < 768) setShowHistory(false);
                            }}
                            title={isHistoryCollapsed ? session.title : ''}
                            className={`w-full text-left px-2 py-2 rounded-lg text-xs transition-colors flex items-center space-x-2 pr-8
                              ${isHistoryCollapsed ? 'justify-center pr-2' : ''}
                              ${activeSessionId === session.id ? 'bg-indigo-100 text-indigo-900 font-medium' : 'text-slate-600 hover:bg-slate-200'}
                            `}
                          >
                            <MessageCircle className="h-3 w-3 shrink-0" />
                            {!isHistoryCollapsed && <span className="truncate">{session.title}</span>}
                          </button>
                          {!isHistoryCollapsed && (
                            <button
                              onClick={(e) => deleteSession(e, session.id)}
                              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                              title="Delete Chat"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat Content */}
              <div className="flex-1 flex flex-col bg-white min-w-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && !isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                      <div className="h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">How can I help you?</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Ask me about your courses, study plans, or any academic topics.</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
                          max-w-[85%] p-3 rounded-2xl text-sm
                          ${msg.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm' 
                            : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none shadow-sm'}
                        `}>
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-sm max-w-none prose-indigo">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : (
                            msg.content
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                        <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask GradePro AI..."
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl text-sm transition-all outline-none disabled:opacity-50"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300
          ${isOpen ? 'bg-white text-indigo-600 border border-slate-200' : 'bg-indigo-600 text-white'}
        `}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </motion.button>
    </div>
  );
}
