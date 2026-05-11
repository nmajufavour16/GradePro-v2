import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, LayoutDashboard, LogOut, Menu, X, FileText, Sparkles, ShieldCheck, ChevronLeft, ChevronRight, Settings as SettingsIcon, Library, Bell } from 'lucide-react';
import FloatingAIChat from './FloatingAIChat';
import UserTour from './UserTour';
import { GradeProLogo } from './GradeProLogo';
import InstallPrompt from './InstallPrompt';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Notification } from '../types';

export default function Layout() {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const previousNotificationsRef = useRef<number>(0);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Semesters', href: '/semesters', icon: BookOpen },
    { name: 'Report', href: '/report', icon: FileText },
    { name: 'Library', href: '/library', icon: Library },
    { name: 'GradePro AI', href: '/ai-chat', icon: Sparkles },
    ...(profile?.role === 'admin' ? [{ name: 'Admin', href: '/admin', icon: ShieldCheck }] : []),
  ];

  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;

    // Ask for permissions
    if ('Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission();
    }

    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(d => ({id: d.id, ...d.data()} as Notification));
      const unread = notifs.filter(n => !n.read);
      
      setNotifications(notifs);
      setUnreadNotifications(unread.length);

      // Trigger push notification for new ones
      if (unread.length > previousNotificationsRef.current && 'Notification' in window && window.Notification.permission === 'granted') {
        const latest = unread[0];
        if (latest) {
          new window.Notification("GradePro Notification", {
            body: latest.message,
            icon: '/apple-touch-icon.png'
          });
        }
      }
      
      previousNotificationsRef.current = unread.length;
    });

    return () => unsub();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const markNotificationsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      // In a real app we'd batch this or do it via a cloud function, but for now loop update is fine
      try {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      } catch (err) {}
    }
  };

  return (
    <div className="h-[100dvh] bg-slate-50 flex flex-col md:flex-row w-full overflow-hidden print:bg-white print:block">
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

          <div className="p-3 border-t border-slate-100 relative" id="tour-profile">
            <button
              onClick={() => {
                setShowNotificationDropdown(!showNotificationDropdown);
                if (unreadNotifications > 0) markNotificationsRead();
              }}
              title={isCollapsed ? 'Notifications' : ''}
              className={`flex w-full items-center px-3 py-2.5 mb-1 text-sm font-medium text-slate-600 rounded-lg group hover:text-slate-900 transition-all duration-300 relative overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="absolute inset-0 bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <Bell className={`h-5 w-5 text-slate-400 shrink-0 z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:text-amber-500 ${isCollapsed ? '' : 'mr-3'}`} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full z-20">
                    {unreadNotifications}
                  </span>
                )}
              </div>
              {!isCollapsed && <span className="z-10">Notifications</span>}
            </button>

            {/* Notification Dropdown */}
            {showNotificationDropdown && (
              <div className={`absolute bottom-full left-0 mb-2 w-72 bg-white border border-slate-200 shadow-xl rounded-2xl z-50 overflow-hidden ${isCollapsed ? 'md:left-full md:ml-2 md:bottom-auto md:top-0' : ''}`}>
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Notifications</span>
                  {unreadNotifications > 0 && <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">{unreadNotifications} New</span>}
                </div>
                <div className="max-h-64 overflow-y-auto w-full">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 italic">No recent notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-4 border-b border-slate-50 relative ${!n.read ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                        {!n.read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                        <p className={`text-xs ${!n.read ? 'text-slate-800 font-medium pl-3' : 'text-slate-600'} leading-relaxed`}>{n.message}</p>
                        <span className={`text-[9px] uppercase tracking-wider mt-1 block ${!n.read ? 'text-indigo-400 pl-3' : 'text-slate-400'}`}>
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
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
      <main className="flex-1 min-w-0 overflow-y-auto print:overflow-visible relative">
        <div className={`mx-auto print:p-0 print:max-w-none ${location.pathname === '/ai-chat' ? 'h-full p-0 max-w-none' : 'min-h-full p-4 md:p-8 max-w-7xl'}`}>
          <Outlet />
        </div>
      </main>
      <div className="print:hidden">
        <FloatingAIChat />
        <UserTour />
        <InstallPrompt />
      </div>
    </div>
  );
}
