import React, { useState } from 'react';
import { Course, Assessment } from '../types';
import { useData } from '../contexts/DataContext';
import { X, Plus, Trash2, Calendar, CheckSquare, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AssessmentManagerProps {
  course: Course;
  onClose: () => void;
}

export default function AssessmentManager({ course, onClose }: AssessmentManagerProps) {
  const { updateCourse } = useData();
  const [assessments, setAssessments] = useState<Assessment[]>(course.assessments || []);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'Test' as any,
    weight: 20,
    dueDate: '',
    isCompleted: false
  });

  const handleAdd = () => {
    const newAssessment: Assessment = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData
    };
    const updated = [...assessments, newAssessment];
    setAssessments(updated);
    updateCourse(course.id, { assessments: updated });
    setIsAdding(false);
    setFormData({ title: '', type: 'Test', weight: 20, dueDate: '', isCompleted: false });
  };

  const handleRemove = (id: string) => {
    const updated = assessments.filter(a => a.id !== id);
    setAssessments(updated);
    updateCourse(course.id, { assessments: updated });
  };

  const toggleComplete = (id: string) => {
    const updated = assessments.map(a => a.id === id ? { ...a, isCompleted: !a.isCompleted } : a);
    setAssessments(updated);
    updateCourse(course.id, { assessments: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
          <div>
            <h2 className="text-xl font-bold">{course.code} Roadmap</h2>
            <p className="text-indigo-100 text-sm">Track tests, assignments, and exams</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {assessments.length === 0 && !isAdding && (
              <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                <Calendar className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No assessments tracked for this course.</p>
                <button 
                  onClick={() => setIsAdding(true)}
                  className="mt-4 text-indigo-600 font-bold hover:underline"
                >
                  Add your first assignment/test
                </button>
              </div>
            )}

            {assessments.map((a) => (
              <div 
                key={a.id} 
                className={`p-4 rounded-2xl border transition-all ${a.isCompleted ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <button 
                      onClick={() => toggleComplete(a.id)}
                      className={`mt-1 h-5 w-5 rounded-md border-2 transition-colors flex items-center justify-center ${a.isCompleted ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 hover:border-indigo-400'}`}
                    >
                      {a.isCompleted && <CheckSquare className="h-4 w-4 text-white" />}
                    </button>
                    <div>
                      <h4 className={`font-bold ${a.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>{a.title}</h4>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{a.type}</span>
                        {a.dueDate && (
                          <span className="text-[10px] flex items-center text-slate-500 font-medium">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(a.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        <span className="text-[10px] text-indigo-600 font-bold">{a.weight}% weight</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemove(a.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {isAdding && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-indigo-600 uppercase mb-1 block">Assessment Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Midterm Test"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-indigo-600 uppercase mb-1 block">Type</label>
                    <select 
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value as any})}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    >
                      {['Test', 'Assignment', 'Exam', 'Project', 'Other'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ) )}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-indigo-600 uppercase mb-1 block">Weight (%)</label>
                    <input 
                      type="number" 
                      value={formData.weight}
                      onChange={e => setFormData({...formData, weight: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-indigo-600 uppercase mb-1 block">Due Date</label>
                    <input 
                      type="date" 
                      value={formData.dueDate}
                      onChange={e => setFormData({...formData, dueDate: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="flex-1 px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAdd}
                    disabled={!formData.title}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-center">
          {!isAdding && (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center px-6 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Assessment
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
