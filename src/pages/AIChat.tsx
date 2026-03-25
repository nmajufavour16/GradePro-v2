import React, { useState, useRef, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { useData } from '@/src/contexts/DataContext';
import { calculateCGPA } from '@/src/utils/gpa';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { MessageCircle, Send, Loader2, Sparkles, Plus, Trash2, History, X, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChatSession, ChatMessage } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';

export default function AIChat() {
  const { user, profile } = useAuth();
  const { semesters, courses } = useData();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat sessions
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chatSessions'),
      where('userId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedSessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatSession[];
      
      // Sort in memory to avoid requiring a composite index
      loadedSessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      
      setSessions(loadedSessions);
      
      if (loadedSessions.length > 0 && !activeSessionId) {
        setActiveSessionId(loadedSessions[0].id);
      }
    });

    return () => unsubscribe();
  }, [user, activeSessionId]);

  // Load messages for active session
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'chatMessages'),
      where('chatId', '==', activeSessionId),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      
      // Sort in memory to avoid requiring a composite index
      loadedMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      setMessages(loadedMessages);
    });

    return () => unsubscribe();
  }, [activeSessionId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const createNewSession = async () => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'chatSessions'), {
        userId: user.uid,
        title: 'New Chat',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setActiveSessionId(docRef.id);
    } catch (error) {
      console.error("Error creating session", error);
    }
  };

  const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'chatSessions', sessionId));
      
      const q = query(collection(db, 'chatMessages'), where('chatId', '==', sessionId));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(messageDoc => deleteDoc(doc(db, 'chatMessages', messageDoc.id)));
      await Promise.all(deletePromises);

      if (activeSessionId === sessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        setActiveSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
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
        const docRef = await addDoc(collection(db, 'chatSessions'), {
          userId: user.uid,
          title: userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : ''),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        currentSessionId = docRef.id;
        setActiveSessionId(currentSessionId);
      }

      // Save user message to DB
      await addDoc(collection(db, 'chatMessages'), {
        chatId: currentSessionId,
        userId: user.uid,
        role: 'user',
        content: userMessage,
        createdAt: new Date().toISOString()
      });

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
      await addDoc(collection(db, 'chatMessages'), {
        chatId: currentSessionId,
        userId: user.uid,
        role: 'assistant',
        content: aiResponse,
        createdAt: new Date().toISOString()
      });

      // Update session title if it's still "New Chat"
      const session = sessions.find(s => s.id === currentSessionId);
      if (session && (session.title === 'New Chat' || messages.length === 0)) {
        const titleResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [{ role: 'user', parts: [{ text: `Generate a very short, 3-5 word title for a chat that starts with this question: "${userMessage}". Output ONLY the title.` }] }]
        });
        const newTitle = titleResponse.text?.trim().replace(/^"|"$/g, '') || userMessage.substring(0, 30);
        await updateDoc(doc(db, 'chatSessions', currentSessionId), {
          title: newTitle,
          updatedAt: new Date().toISOString()
        });
      } else {
        await updateDoc(doc(db, 'chatSessions', currentSessionId), {
          updatedAt: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('AI Error:', error);
      if (currentSessionId) {
        await addDoc(collection(db, 'chatMessages'), {
          chatId: currentSessionId,
          userId: user.uid,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again later.',
          createdAt: new Date().toISOString()
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
      {/* Sidebar - Chat History */}
      <div className={`
        fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity md:hidden
        ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `} onClick={() => setIsSidebarOpen(false)} />

      <div className={`
        absolute inset-y-0 left-0 z-50 bg-slate-50 border-r border-slate-200 transform transition-all duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64 w-64'}
      `}>
        <div className="h-full flex flex-col relative">
          {/* Collapse Toggle Button (Desktop) */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex absolute -right-3 top-10 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 shadow-sm z-10"
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          <div className={`p-4 border-b border-slate-200 flex items-center bg-white ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isSidebarCollapsed && <h3 className="font-bold text-slate-800">Chat History</h3>}
            {isSidebarCollapsed && <History className="h-5 w-5 text-slate-400" />}
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 border-b border-slate-200">
            <button
              onClick={() => {
                createNewSession();
                setIsSidebarOpen(false);
              }}
              title={isSidebarCollapsed ? 'New Chat' : ''}
              className={`w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors ${isSidebarCollapsed ? 'p-2' : ''}`}
            >
              <Plus className="h-4 w-4" />
              {!isSidebarCollapsed && <span>New Chat</span>}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map(session => (
              <div key={session.id} className="relative group">
                <button
                  onClick={() => {
                    setActiveSessionId(session.id);
                    setIsSidebarOpen(false);
                  }}
                  title={isSidebarCollapsed ? session.title : ''}
                  className={`w-full text-left px-3 py-3 rounded-xl text-sm transition-colors flex items-center space-x-3 pr-10
                    ${isSidebarCollapsed ? 'justify-center pr-3' : ''}
                    ${activeSessionId === session.id ? 'bg-indigo-100 text-indigo-900 font-medium' : 'text-slate-600 hover:bg-slate-200'}
                  `}
                >
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">{session.title}</span>}
                </button>
                {!isSidebarCollapsed && (
                  <button
                    onClick={(e) => deleteSession(e, session.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete Chat"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {sessions.length === 0 && !isSidebarCollapsed && (
              <div className="text-center text-slate-500 text-sm p-4">
                No chat history yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1 text-slate-400 hover:text-slate-600 mr-2"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-800">GradePro AI</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => {
                createNewSession();
                setIsSidebarOpen(false);
              }}
              className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>New Chat</span>
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex items-center space-x-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium"
            >
              <History className="h-4 w-4" />
              <span>{isSidebarOpen ? 'Hide History' : 'Show History'}</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
          {messages.length === 0 && !isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 bg-indigo-50 rounded-full flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900">How can I help you today?</h3>
                <p className="text-slate-500 mt-1 max-w-sm">Ask me about your courses, study plans, or any academic topics you need help with.</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  max-w-[85%] p-4 rounded-2xl text-sm
                  ${msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'}
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
              <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100">
                <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="flex items-center space-x-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Message GradePro AI..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl text-sm transition-all outline-none disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
