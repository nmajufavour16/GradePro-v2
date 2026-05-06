import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { calculateCGPA } from '../utils/gpa';
import { TrendingUp, Target, BookOpen, GraduationCap, Edit2, Check, Sparkles, BrainCircuit, Lightbulb, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';

export default function Dashboard() {
  const { profile, updateProfile } = useAuth();
  const { semesters, courses } = useData();
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(profile?.targetCGPA?.toString() || '4.5');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  const cgpa = calculateCGPA(semesters, courses);
  const totalUnits = courses.reduce((acc, c) => acc + c.units, 0);

  const chartData = semesters.map(s => {
    const sCourses = courses.filter(c => c.semesterId === s.id);
    const gpa = calculateCGPA([s], sCourses);
    return { name: s.name, gpa };
  });

  const categoryData = ['General', 'Core', 'Elective', 'Practical'].map(cat => {
    const catCourses = courses.filter(c => c.category === cat);
    const gpa = catCourses.length > 0 
      ? catCourses.reduce((acc, c) => acc + (c.gradePoint * c.units), 0) / catCourses.reduce((acc, c) => acc + c.units, 0)
      : 0;
    return { subject: cat, A: gpa, fullMark: profile?.gradingScale || 5.0 };
  });

  const handleSaveTarget = async () => {
    const val = parseFloat(targetInput);
    if (!isNaN(val) && val >= 0 && val <= 5.0) {
      await updateProfile({ targetCGPA: val });
    }
    setIsEditingTarget(false);
  };

  const generateAIInsight = async () => {
    setIsGeneratingInsight(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        Analyze this student's academic profile and provide 3 ultra-concise, strategic insights or recommendations.
        
        Current CGPA: ${cgpa.toFixed(2)}
        Target CGPA: ${profile?.targetCGPA || 4.5}
        Grading Scale: ${profile?.gradingScale || 5.0}
        
        GPA Trend (by semester):
        ${chartData.map(d => `- ${d.name}: ${d.gpa.toFixed(2)}`).join('\n')}
        
        Performance by Category:
        ${categoryData.map(d => `- ${d.subject}: ${d.A.toFixed(2)}`).join('\n')}
        
        The student is in ${profile?.level || 'unknown level'} studying ${profile?.department || 'unknown department'}.
        
        Provide high-level academic coaching. Focus on which areas to prioritize based on the radar chart and how to reach the target based on the trend.
        Use a professional and motivational tone. Use markdown bullet points. Max 150 words.
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      setAiInsight(result.text || '');
    } catch (err) {
      console.error('AI Insight Error:', err);
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {profile?.displayName?.split(' ')[0]}!</h1>
          <p className="text-slate-600 mt-1">Here's your academic overview.</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} id="tour-cgpa" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Current CGPA</h3>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <GraduationCap className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-900">{cgpa.toFixed(2)}</div>
          <p className="text-sm text-slate-500 mt-2">Out of {profile?.gradingScale || 5.0}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} id="tour-target" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Target CGPA</h3>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Target className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isEditingTarget ? (
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  className="w-24 text-3xl font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                />
                <button onClick={handleSaveTarget} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                  <Check className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <>
                <div className="text-4xl font-bold text-slate-900">{profile?.targetCGPA?.toFixed(2) || '4.50'}</div>
                <button onClick={() => setIsEditingTarget(true)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <Edit2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-2">
            {cgpa >= (profile?.targetCGPA || 4.5) ? 'You are hitting your target!' : `Need ${(profile?.targetCGPA || 4.5) - cgpa} more to reach target`}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Units</h3>
            <div className="p-2 bg-amber-50 rounded-lg">
              <BookOpen className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-900">{totalUnits}</div>
          <p className="text-sm text-slate-500 mt-2">Completed units</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Semesters</h3>
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-900">{semesters.length}</div>
          <p className="text-sm text-slate-500 mt-2">Recorded semesters</p>
        </motion.div>
      </motion.div>

      {semesters.length > 0 && (
        <div className="space-y-8">
          {/* AI Insights Bar */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-3xl p-1 shadow-lg overflow-hidden"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-[1.4rem] p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-indigo-600 rounded-2xl shadow-indigo-100 shadow-lg">
                    <BrainCircuit className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">AI Academic Coach</h3>
                    <p className="text-slate-500 text-sm font-medium">Personalized strategy based on your actual performance data.</p>
                  </div>
                </div>
                {!aiInsight && !isGeneratingInsight && (
                  <button 
                    onClick={generateAIInsight}
                    className="flex items-center px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all active:scale-95 shadow-md"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze Data
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                )}
              </div>

              <AnimatePresence>
                {isGeneratingInsight && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-6 flex flex-col items-center justify-center py-8 space-y-4"
                  >
                    <div className="flex space-x-2">
                      <div className="h-3 w-3 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="h-3 w-3 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="h-3 w-3 bg-indigo-600 rounded-full animate-bounce"></div>
                    </div>
                    <p className="text-indigo-600 font-bold uppercase tracking-widest text-xs animate-pulse">Consulting the Knowledge Engine...</p>
                  </motion.div>
                )}

                {aiInsight && !isGeneratingInsight && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-6 p-6 bg-slate-50 rounded-2xl border border-indigo-100/50 relative overflow-hidden"
                  >
                    <Lightbulb className="absolute -top-4 -right-4 h-24 w-24 text-indigo-500/5" />
                    <div className="prose prose-sm prose-indigo max-w-none relative z-10 font-medium text-slate-700 leading-relaxed">
                      <ReactMarkdown>{aiInsight}</ReactMarkdown>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={() => setAiInsight(null)}
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                      >
                        Dismiss Analysis
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div id="tour-trend" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6 font-mono">GPA Trend</h3>
            <div className="h-72 w-full relative group">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis domain={[0, profile?.gradingScale || 5.0]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="gpa" 
                    stroke="#4f46e5" 
                    strokeWidth={4}
                    dot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 10, fill: '#4f46e5', stroke: '#fff', strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6 font-mono">Performance Radar</h3>
            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Radar
                    name="GPA"
                    dataKey="A"
                    stroke="#4f46e5"
                    fill="#4f46e5"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </div>
    )}
    </div>
  );
}
