import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, LayoutDashboard, LogOut, Menu, X, FileText, Sparkles, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import FloatingAIChat from './FloatingAIChat';
import { GradeProLogo } from './GradeProLogo';

export default function Layout() {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Semesters', href: '/semesters', icon: BookOpen },
    { name: 'Report', href: '/report', icon: FileText },
    { name: 'GradePro AI', href: '/ai-chat', icon: Sparkles },
    ...(profile?.role === 'admin' ? [{ name: 'Admin', href: '/admin', icon: ShieldCheck }] : []),
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 print:hidden">
        <GradeProLogo className="h-8" />
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transform transition-all duration-300 ease-in-out
        md:relative md:translate-x-0 print:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64 w-64'}
      `}>
        <div className="h-full flex flex-col relative">
          {/* Collapse Toggle Button (Desktop) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex absolute -right-3 top-10 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 shadow-sm z-10"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          <div className={`p-6 hidden md:flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
            <GradeProLogo className="h-10 shrink-0" />
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  title={isCollapsed ? item.name : ''}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                    ${isCollapsed ? 'justify-center' : ''}
                    ${isActive 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <item.icon className={`h-5 w-5 shrink-0 ${isCollapsed ? '' : 'mr-3'} ${isActive ? 'text-indigo-700' : 'text-slate-400'}`} />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200">
            <div className={`flex items-center px-4 py-3 mb-2 ${isCollapsed ? 'justify-center' : ''}`}>
              <img 
                src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName || 'User'}&background=random`} 
                alt="Profile" 
                className="h-8 w-8 rounded-full shrink-0"
                referrerPolicy="no-referrer"
              />
              {!isCollapsed && (
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-medium text-slate-900 truncate">{profile?.displayName || 'Student'}</p>
                  <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              title={isCollapsed ? 'Sign out' : ''}
              className={`flex w-full items-center px-4 py-2 text-sm font-medium text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
            >
              <LogOut className={`h-5 w-5 text-slate-400 shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && <span>Sign out</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full print:overflow-visible print:w-full print:p-0 print:m-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto h-full print:p-0 print:max-w-none">
          <Outlet />
        </div>
      </main>
      <div className="print:hidden">
        <FloatingAIChat />
      </div>
    </div>
  );
}
