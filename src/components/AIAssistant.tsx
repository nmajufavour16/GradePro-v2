import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { calculateCGPA } from '../utils/gpa';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';

export default function AIAssistant() {
  const { profile } = useAuth();
  const { semesters, courses } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { role: 'assistant', content: `Hi ${profile?.displayName?.split(' ')[0] || 'there'}! I'm GradePro AI – Your Study Assistant. How can I help you with your studies today?` }
      ]);
      
      // Initialize chat session
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const cgpa = calculateCGPA(semesters, courses);
      const totalUnits = courses.reduce((acc, c) => acc + c.units, 0);
      
      const context = `
        You are GradePro AI, a comprehensive Study Assistant and academic tutor.
        The student's name is ${profile?.displayName || 'Student'}.
        
        Your primary goal is to help the user learn, understand concepts deeply, and succeed academically. 
        You can help with assignments, creating study plans, explaining complex topics in simple terms, and providing general learning support.
        
        IMPORTANT RULES:
        1. Focus on improving the user's knowledge and ensuring they truly understand the answers or solutions you provide.
        2. DO NOT mention or focus on their CGPA unless the user explicitly asks about it, or if the question is directly related to calculating/improving their CGPA.
        3. Keep your explanations clear, encouraging, and easy to understand.
        4. Format your responses using markdown for readability.

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

      chatRef.current = ai.chats.create({
        model: 'gemini-3.1-flash',
        config: {
          systemInstruction: context,
        }
      });
    }
  }, [isOpen, profile, semesters, courses, messages.length]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !chatRef.current) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMessage });
      setMessages(prev => [...prev, { role: 'assistant', content: response.text || 'I am not sure how to respond to that.' }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all transform hover:scale-105 z-50 flex items-center space-x-2
          ${isOpen ? 'hidden' : 'flex'}
        `}
      >
        <Sparkles className="h-6 w-6" />
        <span className="font-medium hidden md:inline">Ask GradePro AI</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-96 md:h-[600px] bg-white md:rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-slate-200">
          <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">GradePro AI</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-indigo-100 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  max-w-[80%] p-3 rounded-2xl text-sm
                  ${msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-tl-none'}
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
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                  <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-slate-200">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask for study tips..."
                className="flex-1 px-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl text-sm transition-all outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
