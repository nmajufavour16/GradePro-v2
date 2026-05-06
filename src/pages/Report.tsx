import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { calculateCGPA, calculateGPA } from '../utils/gpa';
import { Printer, Download, BookOpen, GraduationCap, Sparkles, Loader2 } from 'lucide-react';
import { GradeProLogo } from '../components/GradeProLogo';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

export default function Report() {
  const { profile } = useAuth();
  const { semesters, courses } = useData();
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrintHint, setShowPrintHint] = useState(false);

  const cgpa = calculateCGPA(semesters, courses);
  const totalUnits = courses.reduce((acc, c) => acc + c.units, 0);

  const generateInsights = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const academicData = semesters.map(s => {
        const sCourses = courses.filter(c => c.semesterId === s.id);
        const gpa = calculateGPA(sCourses);
        return `Semester: ${s.name} (${s.level}) - GPA: ${gpa.toFixed(2)}, Courses: ${sCourses.map(c => `${c.code} (${c.grade})`).join(', ')}`;
      }).join('\n');

      const prompt = `
        Analyze this student's academic performance and provide 3-4 actionable insights or study tips.
        Student: ${profile?.displayName}
        Department: ${profile?.department}
        Level: ${profile?.level}
        Current CGPA: ${cgpa.toFixed(2)}
        Target CGPA: ${profile?.targetCGPA}
        
        Academic History:
        ${academicData}
        
        Provide the response in a professional, encouraging tone using markdown.
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      setAiInsights(result.text || '');
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    setShowPrintHint(true);
    setTimeout(() => setShowPrintHint(false), 8000);
    try {
      window.print();
    } catch (e) {
      console.error('Print failed:', e);
      alert('Printing is blocked in this preview. Please open the app in a new tab using the button in the top right corner.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Academic Report</h1>
          <p className="text-slate-600 mt-1">Generate and print your official GradePro report.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generateInsights}
              disabled={isGenerating}
              className="flex items-center justify-center px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Sparkles className="h-5 w-5 mr-2" />}
              AI Insights
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm min-w-[200px]"
            >
              <Printer className="h-5 w-5 mr-2" />
              Print / Save PDF
            </motion.button>
          </div>
          <AnimatePresence>
            {showPrintHint && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium text-amber-600 bg-amber-50 px-4 py-2 rounded-xl max-w-sm text-right border border-amber-200 shadow-sm"
              >
                If the print dialog doesn't appear, please open the app in a new tab first (arrow icon on the top right).
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto print:p-0 print:border-none print:shadow-none print:m-0">
        <div className="max-w-4xl mx-auto bg-white p-8 print:p-0 print:max-w-none">
          {/* Report Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-6 mb-8">
            <div className="flex items-center space-x-3">
              <GradeProLogo className="h-12" />
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Date Generated</p>
              <p className="font-bold text-slate-900">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
              <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold mb-1">Student Name</p>
              <p className="text-xl font-bold text-slate-900">{profile?.displayName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold mb-1">Email</p>
              <p className="text-xl font-bold text-slate-900">{profile?.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold mb-1">Institution</p>
              <p className="text-lg font-bold text-slate-900">{profile?.institution || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold mb-1">Faculty</p>
              <p className="text-lg font-bold text-slate-900">{profile?.faculty || 'N/A'}</p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-center sm:justify-around bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-12 gap-6 sm:gap-0">
            <div className="text-center">
              <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold mb-2">Cumulative GPA</p>
              <div className="flex items-center justify-center space-x-2">
                <GraduationCap className="h-8 w-8 text-indigo-600 shrink-0" />
                <span className="text-4xl font-bold text-slate-900 truncate">{cgpa.toFixed(2)}</span>
              </div>
            </div>
            <div className="hidden sm:block w-px h-16 bg-slate-200"></div>
            <div className="text-center">
              <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold mb-2">Total Units</p>
              <span className="text-4xl font-bold text-slate-900 truncate">{totalUnits}</span>
            </div>
            <div className="hidden sm:block w-px h-16 bg-slate-200"></div>
            <div className="text-center">
              <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold mb-2">Semesters</p>
              <span className="text-4xl font-bold text-slate-900 truncate">{semesters.length}</span>
            </div>
          </div>

          {/* AI Insights Section */}
          <AnimatePresence>
          {aiInsights && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-12 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 break-inside-avoid overflow-hidden"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-emerald-900">AI Performance Insights</h3>
              </div>
              <div className="prose prose-sm max-w-none prose-emerald">
                <ReactMarkdown>{aiInsights}</ReactMarkdown>
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          {/* Semester Breakdown */}
          <div className="space-y-10">
            <h3 className="text-xl font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">Academic Record</h3>
            
            {semesters.length === 0 ? (
              <p className="text-slate-500 italic">No academic records found.</p>
            ) : (
              semesters.map(semester => {
                const semesterCourses = courses.filter(c => c.semesterId === semester.id);
                const gpa = calculateGPA(semesterCourses);
                const sUnits = semesterCourses.reduce((acc, c) => acc + c.units, 0);

                return (
                  <div key={semester.id} className="break-inside-avoid">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-100 px-4 py-3 sm:py-2 rounded-t-xl border border-slate-200 border-b-0 gap-2 sm:gap-0">
                      <h4 className="font-bold text-slate-900">{semester.level} - {semester.name}</h4>
                      <div className="text-sm font-semibold text-slate-700">
                        GPA: <span className="text-indigo-600">{gpa.toFixed(2)}</span> | Units: {sUnits}
                      </div>
                    </div>
                    <div className="overflow-x-auto border border-t-0 border-slate-200 rounded-b-xl">
                      <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200">Course Code</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200">Title</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center border-r border-slate-200">Units</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center border-r border-slate-200">Grade</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Points</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {semesterCourses.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-4 text-center text-sm text-slate-500 italic border-l border-r border-slate-200 first:border-l-0 last:border-r-0">No courses recorded.</td>
                            </tr>
                          ) : (
                            semesterCourses.map(course => (
                              <tr key={course.id}>
                                <td className="px-4 py-2 text-sm font-bold text-slate-900 border-r border-slate-200">{course.code}</td>
                                <td className="px-4 py-2 text-sm text-slate-700 border-r border-slate-200">{course.title || '-'}</td>
                                <td className="px-4 py-2 text-sm text-center font-medium text-slate-900 border-r border-slate-200">{course.units}</td>
                                <td className="px-4 py-2 text-sm text-center font-bold text-slate-900 border-r border-slate-200">{course.grade}</td>
                                <td className="px-4 py-2 text-sm text-center font-medium text-slate-900">{(course.gradePoint * course.units).toFixed(1)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-16 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
            <p>This document is generated by GradePro AI and serves as an unofficial academic record.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
