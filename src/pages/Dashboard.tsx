import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { calculateCGPA } from '../utils/gpa';
import { TrendingUp, Target, BookOpen, GraduationCap, Edit2, Check } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { profile, updateProfile } = useAuth();
  const { semesters, courses } = useData();
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(profile?.targetCGPA?.toString() || '4.5');

  const cgpa = calculateCGPA(semesters, courses);
  const totalUnits = courses.reduce((acc, c) => acc + c.units, 0);

  const chartData = semesters.map(s => {
    const sCourses = courses.filter(c => c.semesterId === s.id);
    const gpa = calculateCGPA([s], sCourses);
    return { name: s.name, gpa };
  });

  const handleSaveTarget = async () => {
    const val = parseFloat(targetInput);
    if (!isNaN(val) && val >= 0 && val <= 5.0) {
      await updateProfile({ targetCGPA: val });
    }
    setIsEditingTarget(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {profile?.displayName?.split(' ')[0]}!</h1>
          <p className="text-slate-600 mt-1">Here's your academic overview.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div id="tour-cgpa" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Current CGPA</h3>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <GraduationCap className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-900">{cgpa.toFixed(2)}</div>
          <p className="text-sm text-slate-500 mt-2">Out of {profile?.gradingScale || 5.0}</p>
        </div>

        <div id="tour-target" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
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
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Units</h3>
            <div className="p-2 bg-amber-50 rounded-lg">
              <BookOpen className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-900">{totalUnits}</div>
          <p className="text-sm text-slate-500 mt-2">Completed units</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Semesters</h3>
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-900">{semesters.length}</div>
          <p className="text-sm text-slate-500 mt-2">Recorded semesters</p>
        </div>
      </div>

      {semesters.length > 0 && (
        <div id="tour-trend" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">GPA Trend</h3>
          <div className="h-72 w-full relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis domain={[0, profile?.gradingScale || 5.0]} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="gpa" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
