import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Bell, Moon, Shield, Save, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Settings() {
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: profile?.displayName || '',
    institution: profile?.institution || '',
    faculty: profile?.faculty || '',
    department: profile?.department || '',
    level: profile?.level || '',
    gradingScale: profile?.gradingScale?.toString() || '5.0',
    targetCGPA: profile?.targetCGPA?.toString() || '4.5',
  });

  const [notifications, setNotifications] = useState({
    gpaAlerts: true,
    aiSuggestions: true,
    marketing: false,
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await updateProfile({
        displayName: formData.name,
        institution: formData.institution,
        faculty: formData.faculty,
        department: formData.department,
        level: formData.level,
        gradingScale: parseFloat(formData.gradingScale),
        targetCGPA: parseFloat(formData.targetCGPA),
      });
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
    } catch (error) {
      console.error('Update profile error:', error);
      setMessage({ type: 'error', text: 'Failed to update settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-2">Manage your account and app preferences</p>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl flex items-center space-x-3 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}
        >
          {message.type === 'success' ? <Shield className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="font-medium">{message.text}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation Tabs (Visual only for now) */}
        <div className="lg:col-span-1 border-r border-slate-200 pr-8 space-y-2">
          <button className="w-full flex items-center space-x-3 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-medium transition-colors">
            <User className="h-5 w-5" />
            <span>Account Details</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors">
            <Bell className="h-5 w-5" />
            <span>Notifications</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors">
            <Moon className="h-5 w-5" />
            <span>Appearance</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Account Settings */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <User className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Account Details</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Institution</label>
                  <input
                    type="text"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Enter institution"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Faculty</label>
                  <input
                    type="text"
                    value={formData.faculty}
                    onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Enter faculty"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Enter department"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    {["100 Level", "200 Level", "300 Level", "400 Level", "500 Level", "600 Level"].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Grading Scale</label>
                  <select
                    value={formData.gradingScale}
                    onChange={(e) => setFormData({ ...formData, gradingScale: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="4.0">4.0 Scale</option>
                    <option value="5.0">5.0 Scale</option>
                    <option value="7.0">7.0 Scale</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Target CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.gradingScale}
                    value={formData.targetCGPA}
                    onChange={(e) => setFormData({ ...formData, targetCGPA: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="e.g. 4.50"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5 mr-2" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </section>

          {/* Notifications */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <Bell className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Notification Preferences</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <div>
                  <p className="font-medium text-slate-900">GPA Alerts</p>
                  <p className="text-xs text-slate-500">Get notified when your GPA reaches a threshold</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notifications.gpaAlerts} 
                    onChange={e => setNotifications({...notifications, gpaAlerts: e.target.checked})}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <div>
                  <p className="font-medium text-slate-900">AI Assistant Suggestions</p>
                  <p className="text-xs text-slate-500">Enable proactive academic tips from GradePro AI</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notifications.aiSuggestions} 
                    onChange={e => setNotifications({...notifications, aiSuggestions: e.target.checked})}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Theme / Dark Mode */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                <Moon className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Appearance</h2>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 grayscale-[0.5] opacity-60">
              <div>
                <p className="font-medium text-slate-900">Dark Mode</p>
                <p className="text-xs text-slate-500 italic">"We're currently working on it..."</p>
              </div>
              <div className="w-11 h-6 bg-slate-200 rounded-full cursor-not-allowed"></div>
            </div>

            <div className="absolute top-0 right-0 p-4">
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">Coming Soon</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
