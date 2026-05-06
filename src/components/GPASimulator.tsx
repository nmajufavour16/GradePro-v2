import React, { useState, useEffect } from 'react';
import { Course, UserProfile } from '../types';
import { getGradePoint } from '../utils/gpa';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, Info } from 'lucide-react';

interface GPASimulatorProps {
  currentCourses: Course[];
  profile: UserProfile | null;
  onClose: () => void;
}

export default function GPASimulator({ currentCourses, profile, onClose }: GPASimulatorProps) {
  const [simulatedCourses, setSimulatedCourses] = useState<Course[]>([]);
  const gradingScale = profile?.gradingScale || 5.0;

  useEffect(() => {
    setSimulatedCourses(JSON.parse(JSON.stringify(currentCourses)));
  }, [currentCourses]);

  const updateSimulatedGrade = (courseId: string, newGrade: string) => {
    setSimulatedCourses(courses => 
      courses.map(c => c.id === courseId ? { 
        ...c, 
        grade: newGrade, 
        gradePoint: getGradePoint(newGrade, gradingScale) 
      } : c)
    );
  };

  const calculateSimulatedGPA = () => {
    if (simulatedCourses.length === 0) return 0;
    const totalPoints = simulatedCourses.reduce((acc, c) => acc + (c.gradePoint * c.units), 0);
    const totalUnits = simulatedCourses.reduce((acc, c) => acc + c.units, 0);
    return totalUnits > 0 ? totalPoints / totalUnits : 0;
  };

  const simulatedGPA = calculateSimulatedGPA();
  const currentGPA = currentCourses.reduce((acc, c) => acc + (c.gradePoint * c.units), 0) / (currentCourses.reduce((acc, c) => acc + c.units, 0) || 1);
  const diff = simulatedGPA - currentGPA;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-600 text-white">
          <div>
            <h2 className="text-xl font-bold">GPA "What-If" Simulator</h2>
            <p className="text-emerald-100 text-sm">See how different grades affect your target</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
              Adjust Course Grades
            </h3>
            
            <div className="space-y-3">
              {simulatedCourses.map((course) => (
                <div key={course.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex-1 min-w-[150px]">
                    <p className="font-bold text-slate-900">{course.code}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{course.title || 'No title'}</p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Units</p>
                      <p className="font-bold text-slate-700">{course.units}</p>
                    </div>
                    
                    <div className="flex gap-1">
                      {['A', 'B', 'C', 'D', 'E', 'F'].map((g) => (
                        <button
                          key={g}
                          onClick={() => updateSimulatedGrade(course.id, g)}
                          className={`w-8 h-8 rounded-lg font-bold text-sm flex items-center justify-center transition-all ${
                            course.grade === g 
                              ? 'bg-indigo-600 text-white shadow-md scale-110' 
                              : 'bg-white text-slate-400 hover:bg-indigo-50 border border-slate-200'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Simulated Outcome</h3>
              
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Projected Semester GPA</p>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-black text-white">{simulatedGPA.toFixed(2)}</span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${diff >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(simulatedGPA / gradingScale) * 100}%` }}
                    className={`h-full ${simulatedGPA >= 4.5 ? 'bg-indigo-500' : simulatedGPA >= 3.5 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  />
                </div>

                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Target CGPA</span>
                    <span className="font-bold">{profile?.targetCGPA || 4.5}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total Units</span>
                    <span className="font-bold">{simulatedCourses.reduce((acc, c) => acc + c.units, 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 flex items-start space-x-3">
              <Info className="h-5 w-5 mt-0.5 shrink-0" />
              <div className="text-xs space-y-2">
                <p className="font-bold">Proactive Insight:</p>
                {simulatedGPA >= (profile?.targetCGPA || 4.5) ? (
                  <p>Great! Maintaining these grades will keep you on track for your first-class goal.</p>
                ) : (
                  <p>To reach your {profile?.targetCGPA || 4.5} goal, try converting more grades to 'A's. High-unit courses have the biggest impact.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
