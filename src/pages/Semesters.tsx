import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { calculateCGPA } from '../utils/gpa';
import { generateCurriculum } from '../utils/ai';
import { Plus, Trash2, ChevronRight, BookOpen, Sparkles, Loader2 as LoaderIcon, FileUp } from 'lucide-react';
import TranscriptScanner from '../components/TranscriptScanner';
import { motion, AnimatePresence } from 'motion/react';

export default function Semesters() {
  const { user, profile } = useAuth();
  const { semesters, courses, addSemester, deleteSemester } = useData();
  const [isAdding, setIsAdding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [level, setLevel] = useState('100L');
  const [name, setName] = useState('First Semester');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addSemester({ level, name });
    setIsAdding(false);
    setLevel('100L');
    setName('First Semester');
  };

  const handleAutoGenerate = async () => {
    if (!profile || !user) return;
    
    setIsGenerating(true);
    try {
      await generateCurriculum(
        profile.institution || 'University',
        profile.department || 'Department',
        level,
        user.uid
      );
      setIsAdding(false);
    } catch (error) {
      console.error('Error auto-generating curriculum:', error);
      alert('Failed to generate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Semesters</h1>
          <p className="text-slate-600 mt-1">Manage your academic terms and courses.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsScanning(true)}
            className="flex items-center justify-center px-4 py-2 bg-white text-indigo-600 border border-indigo-200 font-medium rounded-xl hover:bg-slate-50 transition-all shadow-sm hover:scale-105 active:scale-95"
          >
            <FileUp className="h-5 w-5 mr-2" />
            AI Scanner
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:scale-105 active:scale-95"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Semester
          </button>
        </div>
      </div>

      {isScanning && <TranscriptScanner onClose={() => setIsScanning(false)} />}

      <AnimatePresence>
      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -20 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100"
        >
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              >
                {['100L', '200L', '300L', '400L', '500L', '600L'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">Semester Name</label>
              <select
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              >
                {['First Semester', 'Second Semester', 'Summer'].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                disabled={isGenerating}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAutoGenerate}
                disabled={isGenerating || !profile?.department}
                className="flex-1 px-4 py-2 bg-slate-50 text-indigo-600 font-medium rounded-xl hover:bg-slate-100 border border-indigo-200 transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center min-w-[140px]"
                title={!profile?.department ? 'Please set your department in profile first' : ''}
              >
                {isGenerating ? (
                  <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                AI Generate
              </button>
              <button
                type="submit"
                disabled={isGenerating}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        </motion.div>
      )}
      </AnimatePresence>

      {semesters.length === 0 && !isAdding ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed"
        >
          <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No semesters yet</h3>
          <p className="mt-1 text-slate-500">Get started by adding your first semester.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
          {semesters.map((semester, index) => {
            const semesterCourses = courses.filter(c => c.semesterId === semester.id);
            const gpa = calculateCGPA([semester], semesterCourses);
            const totalUnits = semesterCourses.reduce((acc, c) => acc + c.units, 0);

            return (
              <motion.div 
                key={semester.id} 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all group flex flex-col"
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full mb-2">
                        {semester.level}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{semester.name}</h3>
                    </div>
                    <button
                      onClick={() => deleteSemester(semester.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
                    <div>
                      <p className="text-sm text-slate-500">GPA</p>
                      <p className="text-2xl font-bold text-slate-900">{gpa.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Units</p>
                      <p className="text-2xl font-bold text-slate-900">{totalUnits}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Courses</p>
                      <p className="text-2xl font-bold text-slate-900">{semesterCourses.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 group-hover:bg-indigo-50/50 transition-colors">
                  <Link
                    to={`/semesters/${semester.id}`}
                    className="flex items-center justify-between text-indigo-600 font-medium hover:text-indigo-700 transition-colors relative"
                  >
                    View Courses
                    <ChevronRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
