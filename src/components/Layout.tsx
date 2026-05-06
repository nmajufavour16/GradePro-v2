import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, LayoutDashboard, LogOut, Menu, X, FileText, Sparkles, ShieldCheck, ChevronLeft, ChevronRight, Settings as SettingsIcon, Library } from 'lucide-react';
import FloatingAIChat from './FloatingAIChat';
import UserTour from './UserTour';
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
    { name: 'Library', href: '/library', icon: Library },
    { name: 'GradePro AI', href: '/ai-chat', icon: Sparkles },
    ...(profile?.role === 'admin' ? [{ name: 'Admin', href: '/admin', icon: ShieldCheck }] : []),
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row w-full overflow-hidden print:bg-white print:block">
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

          <div className={`p-6 hidden md:flex items-center ${isCollapsed ? 'justify-center p-4' : ''}`}>
            {isCollapsed ? (
              <div className="bg-indigo-600 rounded-xl p-2 flex items-center justify-center shadow-sm">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            ) : (
              <GradeProLogo className="h-8 shrink-0" />
            )}
          </div>

          <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              const tourId = item.name === 'Semesters' ? 'tour-semesters' : 
                            item.name === 'Dashboard' ? 'tour-dashboard-nav' : 
                            item.name === 'GradePro AI' ? 'tour-ai-nav' : undefined;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  id={tourId}
                  onClick={() => setIsMobileMenuOpen(false)}
                  title={isCollapsed ? item.name : ''}
                  className={`
                    flex items-center px-3 py-2.5 text-sm font-medium transition-all duration-300 relative group text-slate-600 hover:text-slate-900 rounded-lg overflow-hidden
                    ${isCollapsed ? 'justify-center relative' : ''}
                  `}
                >
                  {/* Subtle hover background */}
                  <div className="absolute inset-0 bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Active state background (5% opacity) and vertical accent line */}
                  {isActive && (
                    <>
                      <div className="absolute inset-0 bg-indigo-600 opacity-5" />
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full" />
                    </>
                  )}

                  <item.icon className={`h-5 w-5 shrink-0 z-10 transition-transform duration-300 group-hover:scale-110 ${isCollapsed ? '' : 'mr-3'} ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {!isCollapsed && <span className={`z-10 truncate ${isActive ? 'text-indigo-700 font-semibold' : ''}`}>{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-slate-100" id="tour-profile">
            <div className={`flex items-center px-3 py-3 mb-2 ${isCollapsed ? 'justify-center' : ''}`}>
              <img 
                src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName || 'User'}&background=random`} 
                alt="Profile" 
                className="h-8 w-8 rounded-full shrink-0 border border-slate-200"
                referrerPolicy="no-referrer"
              />
              {!isCollapsed && (
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-medium text-slate-900 truncate">{profile?.displayName || 'Student'}</p>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider truncate">{profile?.email?.split('@')[0] || 'User'}</p>
                </div>
              )}
            </div>
            <Link
              to="/settings"
              id="tour-settings-nav"
              className={`flex w-full items-center px-3 py-2.5 mb-1 text-sm font-medium text-slate-600 rounded-lg group hover:text-slate-900 transition-all duration-300 relative overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="absolute inset-0 bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <SettingsIcon className={`h-5 w-5 text-slate-400 shrink-0 z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-45 group-hover:text-slate-600 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && <span className="z-10">Settings</span>}
            </Link>
            <button
              onClick={handleLogout}
              title={isCollapsed ? 'Sign out' : ''}
              className={`flex w-full items-center px-3 py-2.5 text-sm font-medium text-slate-600 rounded-lg group hover:text-red-600 transition-all duration-300 relative overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="absolute inset-0 bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <LogOut className={`h-5 w-5 text-slate-400 shrink-0 z-10 transition-transform duration-300 group-hover:scale-110 group-hover:text-red-500 group-hover:-translate-x-0.5 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && <span className="z-10">Sign out</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto print:overflow-visible">
        <div className={`mx-auto h-full print:p-0 print:max-w-none ${location.pathname === '/ai-chat' ? 'p-0 max-w-none' : 'p-4 md:p-8 max-w-7xl'}`}>
          <Outlet />
        </div>
      </main>
      <div className="print:hidden">
        <FloatingAIChat />
        <UserTour />
      </div>
    </div>
  );
}
