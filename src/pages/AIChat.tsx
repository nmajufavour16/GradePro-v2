import React, { useState, useRef, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { useData } from '@/src/contexts/DataContext';
import { calculateCGPA } from '@/src/utils/gpa';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { MessageCircle, Send, Loader2, Sparkles, Plus, Trash2, History, X, Menu, ChevronLeft, ChevronRight, Image as ImageIcon, Brain } from 'lucide-react';
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isHighThinking, setIsHighThinking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image is too large. Please select an image under 5MB.');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading || !user) return;

    let currentSessionId = activeSessionId;
    const userMessage = input.trim();
    const currentImage = selectedImage;
    const currentThinking = isHighThinking;
    
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // Create session if none exists
      if (!currentSessionId) {
        const docRef = await addDoc(collection(db, 'chatSessions'), {
          userId: user.uid,
          title: userMessage ? (userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : '')) : 'Image Analysis',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        currentSessionId = docRef.id;
        setActiveSessionId(currentSessionId);
      }

      // Save user message to DB
      const messageData: any = {
        chatId: currentSessionId,
        userId: user.uid,
        role: 'user',
        content: userMessage || (currentImage ? 'Analyzed an image' : ''),
        isThinking: currentThinking,
        createdAt: new Date().toISOString()
      };
      if (currentImage) {
        messageData.imageUrl = currentImage;
      }
      await addDoc(collection(db, 'chatMessages'), messageData);

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
      `;

      const historyContents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      
      const currentParts: any[] = [];
      if (userMessage) {
        currentParts.push({ text: userMessage });
      }
      if (currentImage) {
        const base64Data = currentImage.split(',')[1];
        const mimeType = currentImage.split(';')[0].split(':')[1];
        currentParts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }

      historyContents.push({
        role: 'user',
        parts: currentParts
      });

      // Select model based on input
      const modelName = (currentImage || currentThinking) ? 'gemini-3.1-pro' : 'gemini-3.1-flash';
      const config: any = {
        systemInstruction: context,
        maxOutputTokens: 4096,
      };

      if (currentThinking) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }

      // Get AI response
      const response = await ai.models.generateContent({
        model: modelName,
        contents: historyContents,
        config: config
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
          model: 'gemini-3.1-flash',
          contents: [{ role: 'user', parts: [{ text: `Generate a very short, 3-5 word title for a chat that starts with this: "${userMessage || 'Image Analysis'}". Output ONLY the title.` }] }]
        });
        const newTitle = titleResponse.text?.trim().replace(/^"|"$/g, '') || (userMessage ? userMessage.substring(0, 30) : 'Image Analysis');
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
          content: 'Sorry, I encountered an error. If you attached an image, it might be too large or not in a supported format. Please try again with a smaller image or just text.',
          createdAt: new Date().toISOString()
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full min-h-[calc(100vh-4rem)] md:min-h-screen flex flex-col md:flex-row bg-white relative">
      {/* Sidebar - Chat History */}
      <div className={`
        fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity md:hidden
        ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `} onClick={() => setIsSidebarOpen(false)} />

      <div className={`
        absolute inset-y-0 left-0 z-50 bg-white border-r border-slate-100 transform transition-all duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isSidebarCollapsed ? 'md:w-16' : 'md:w-64 w-64'}
      `}>
        <div className="h-full flex flex-col relative">
          {/* Collapse Toggle Button (Desktop) */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-slate-800 shadow-sm z-10 hover:scale-110 transition-transform"
          >
            {isSidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>

          <div className={`p-4 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isSidebarCollapsed && <h3 className="font-semibold text-slate-800 text-sm tracking-wide">Recent</h3>}
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
            {!isSidebarCollapsed && (
              <button 
                onClick={() => {
                  createNewSession();
                  setIsSidebarOpen(false);
                }}
                className="text-slate-400 hover:text-indigo-600 transition-colors"
                title="New Chat"
              >
                <Plus className="h-5 w-5" />
              </button>
            )}
            {isSidebarCollapsed && (
              <button 
                onClick={() => {
                  createNewSession();
                  setIsSidebarOpen(false);
                }}
                className="text-slate-400 hover:text-indigo-600 transition-colors mt-2"
                title="New Chat"
              >
                <Plus className="h-5 w-5" />
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 space-y-0.5 mt-2">
            {sessions.map(session => (
              <div key={session.id} className="relative group">
                <button
                  onClick={() => {
                    setActiveSessionId(session.id);
                    setIsSidebarOpen(false);
                  }}
                  title={isSidebarCollapsed ? session.title : ''}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center pr-8
                    ${isSidebarCollapsed ? 'justify-center pr-3' : 'space-x-3'}
                    ${activeSessionId === session.id ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
                  `}
                >
                  <MessageCircle className={`h-4 w-4 shrink-0 transition-colors ${activeSessionId === session.id ? 'text-indigo-500' : 'text-slate-400'}`} />
                  {!isSidebarCollapsed && <span className="truncate">{session.title}</span>}
                </button>
                {!isSidebarCollapsed && (
                  <button
                    onClick={(e) => deleteSession(e, session.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete Chat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <div className="pt-6 pb-2 px-6 lg:px-12 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-800 transition-colors rounded-lg hover:bg-slate-50"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="font-medium text-slate-800 tracking-tight text-lg flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              GradePro AI
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => {
                createNewSession();
                setIsSidebarOpen(false);
              }}
              className="p-2 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all rounded-lg"
              title="New Chat"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-12 pb-32">
          <div className="max-w-3xl mx-auto space-y-8 pt-4">
            {messages.length === 0 && !isLoading ? (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
                <div className="h-20 w-20 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl flex items-center justify-center shadow-sm">
                  <Sparkles className="h-10 w-10 text-indigo-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-medium text-slate-800 tracking-tight">How can I help you?</h3>
                  <p className="text-slate-500 text-sm max-w-[260px] mx-auto leading-relaxed">I'm ready to assist with assignments, study plans, or any academic topics.</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mr-4 mt-1">
                      <Sparkles className="h-4 w-4 text-indigo-500" />
                    </div>
                  )}
                  <div className={`
                    max-w-[85%] sm:max-w-[75%] rounded-2xl text-[15px] leading-relaxed
                    ${msg.role === 'user' 
                      ? 'bg-slate-100 text-slate-900 px-5 py-3.5 rounded-tr-sm font-medium' 
                      : 'text-slate-800'}
                  `}>
                    {msg.imageUrl && (
                      <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={msg.imageUrl} alt="Uploaded content" className="max-h-64 w-auto object-contain" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-slate prose-sm sm:prose-base max-w-none 
                        prose-p:leading-relaxed prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-200 prose-pre:text-slate-800 
                        prose-headings:font-medium prose-a:text-indigo-600 hover:prose-a:text-indigo-500">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {msg.content}
                        {msg.isThinking && (
                          <span className="text-[11px] opacity-60 flex items-center gap-1 font-normal tracking-wide uppercase">
                            <Brain className="h-3 w-3" /> High Thinking
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start items-center">
                <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mr-4">
                  <Sparkles className="h-4 w-4 text-indigo-500 opacity-50" />
                </div>
                <div className="flex space-x-1.5 pt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-10 pb-6 px-4">
          <div className="max-w-3xl mx-auto">
            {/* Selected Image Preview attached right above the input */}
            <AnimatePresence>
              {selectedImage && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="mb-3 flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-2 w-fit shadow-sm"
                >
                  <div className="relative h-14 w-14 rounded-md overflow-hidden bg-slate-50">
                    <img src={selectedImage} alt="Preview" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="pr-2">
                    <p className="text-xs font-medium text-slate-700">Image attached</p>
                    <button 
                      onClick={() => setSelectedImage(null)}
                      className="text-[10px] text-red-500 hover:text-red-700 font-medium uppercase tracking-wider"
                    >
                      Remove
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-slate-50 border border-slate-200 rounded-[1.5rem] shadow-sm flex flex-col focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:bg-white transition-all duration-200">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="w-full px-5 py-4 bg-transparent text-slate-800 placeholder-slate-400 outline-none disabled:opacity-50 text-[15px]"
              />
              <div className="flex items-center justify-between px-3 pb-3">
                <div className="flex items-center gap-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors"
                    title="Attach Image"
                  >
                    <ImageIcon className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => setIsHighThinking(!isHighThinking)}
                    className={`p-2 rounded-full transition-colors flex items-center gap-2 ${
                      isHighThinking 
                        ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' 
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                    title="High Thinking"
                  >
                    <Brain className={`h-5 w-5 ${isHighThinking ? 'animate-pulse' : ''}`} strokeWidth={1.5} />
                  </button>
                </div>

                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !selectedImage) || isLoading}
                  className={`p-2 rounded-full transition-all ${
                    (!input.trim() && !selectedImage) || isLoading
                      ? 'bg-slate-200 text-slate-400'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:scale-105 active:scale-95'
                  }`}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                </button>
              </div>
            </div>
            <div className="text-center mt-3">
              <p className="text-[11px] text-slate-400">GradePro AI can make mistakes. Consider verifying important information.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
