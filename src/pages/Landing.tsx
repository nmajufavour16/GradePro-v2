import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/src/contexts/AuthContext';
import { BookOpen, TrendingUp, BrainCircuit, FileText, Loader2 } from 'lucide-react';
import { GradeProLogo } from '../components/GradeProLogo';

export default function Landing() {
  const { user, login, isLoggingIn } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-200">
        <GradeProLogo className="h-10" />
        <button
          onClick={login}
          disabled={isLoggingIn}
          className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isLoggingIn && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign In
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start pt-12 md:justify-center md:pt-6 p-6 text-center">
        <div className="max-w-3xl space-y-8">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
            Master your grades with <span className="text-indigo-600">GradePro AI</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            The ultimate CGPA calculator and academic assistant. Track your progress, project future grades, and get personalized study tips.
          </p>
          
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={login}
              disabled={isLoggingIn}
              className="px-8 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-2xl hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isLoggingIn && <Loader2 className="h-5 w-5 animate-spin" />}
              Get Started for Free
            </button>
          </div>

          <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <TrendingUp className="h-10 w-10 text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Track Progress</h3>
              <p className="text-slate-600">Calculate your CGPA dynamically and project what you need to hit your target.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <BrainCircuit className="h-10 w-10 text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">AI Assistant</h3>
              <p className="text-slate-600">Get personalized study tips and academic advice from GradePro AI.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <FileText className="h-10 w-10 text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Export Reports</h3>
              <p className="text-slate-600">Generate and print beautiful academic reports to share or keep for your records.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
