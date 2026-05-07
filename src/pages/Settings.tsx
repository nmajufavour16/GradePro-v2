import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Bell, Moon, Shield, Save, Loader2, AlertCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'account' | 'notifications' | 'appearance' | 'help';

export default function Settings() {
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [helpSubTab, setHelpSubTab] = useState<'faq' | 'privacy' | 'terms'>('faq');

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

  const getTabClass = (tab: Tab) => {
    const isActive = activeTab === tab;
    return `w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${
      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
    }`;
  };

  const faqs = [
    { q: 'How is my CGPA calculated?', a: 'Your CGPA is calculated by dividing your total grade points by your total units across all semesters.' },
    { q: 'Can I export my transcript?', a: 'Currently, export functionality is limited. We are working on adding PDF transcript generation soon.' },
    { q: 'Is my data secure?', a: 'Yes! We use industry-standard encryption for your data, and we do not share your transcripts with third parties.' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-8"
    >
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Tabs */}
        <div className="md:col-span-1 space-y-2">
          <motion.button onClick={() => setActiveTab('account')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={getTabClass('account')}>
            <User className="h-5 w-5" />
            <span>Account Details</span>
          </motion.button>
          <motion.button onClick={() => setActiveTab('notifications')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={getTabClass('notifications')}>
            <Bell className="h-5 w-5" />
            <span>Notifications</span>
          </motion.button>
          <motion.button onClick={() => setActiveTab('appearance')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={getTabClass('appearance')}>
            <Moon className="h-5 w-5" />
            <span>Appearance</span>
          </motion.button>
          <motion.button onClick={() => setActiveTab('help')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={getTabClass('help')}>
            <HelpCircle className="h-5 w-5" />
            <span>Help & Support</span>
          </motion.button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'account' && (
              <motion.section
                key="account"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <User className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Account Details</h2>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
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
                    </motion.button>
                  </div>
                </form>
              </motion.section>
            )}

            {activeTab === 'notifications' && (
              <motion.section
                key="notifications"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
              >
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
              </motion.section>
            )}

            {activeTab === 'appearance' && (
              <motion.section
                key="appearance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative"
              >
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
              </motion.section>
            )}

            {activeTab === 'help' && (
              <motion.section
                key="help"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Help & Support</h2>
                  </div>
                  <div className="flex space-x-4 border-b border-slate-200 mt-4">
                     <button
                        onClick={() => setHelpSubTab('faq')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${helpSubTab === 'faq' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                     >
                       FAQ
                     </button>
                     <button
                        onClick={() => setHelpSubTab('privacy')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${helpSubTab === 'privacy' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                     >
                       Privacy Policy
                     </button>
                     <button
                        onClick={() => setHelpSubTab('terms')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${helpSubTab === 'terms' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                     >
                       Terms of Service
                     </button>
                  </div>
                </div>
                
                <div className="p-6 bg-slate-50/30 min-h-[300px]">
                  {helpSubTab === 'faq' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Frequently Asked Questions</h3>
                      {faqs.map((faq, index) => (
                        <div key={index} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                          <button
                            onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                            className="w-full flex items-center justify-between p-4 text-left font-medium text-slate-800 hover:bg-slate-50 transition-colors"
                          >
                            <span>{faq.q}</span>
                            {expandedFaq === index ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                          </button>
                          <AnimatePresence>
                            {expandedFaq === index && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="px-4 pb-4 text-slate-600 text-sm leading-relaxed"
                              >
                                {faq.a}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {helpSubTab === 'privacy' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-sm prose-slate max-w-none text-slate-600">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Privacy Policy</h3>
                      <p className="mb-4">Last Updated: May 2026</p>
                      <p className="mb-4">
                        GradePro ("we", "our", or "us") respects your privacy. This Privacy Policy explains how your information is collected, used, and protected when you use our academic tracking application.
                      </p>
                      <h4 className="font-semibold text-slate-800 mt-6 mb-2">1. Information We Collect</h4>
                      <p className="mb-4">We collect account details (name, email via your Google sign-in), profile settings, course entries, and academic transcripts you choose to scan or upload. Uploaded data is processed via secure integrations.</p>
                      <h4 className="font-semibold text-slate-800 mt-6 mb-2">2. How We Use Information</h4>
                      <p className="mb-4">Your data is strictly used to provide the GradePro services—calculating your CGPA, tracking academic progress, and offering AI suggestions. We do not sell your personal data.</p>
                      <h4 className="font-semibold text-slate-800 mt-6 mb-2">3. Security</h4>
                      <p>We use standard Firebase authentication and database rules to ensure your data is secure and accessible only to you.</p>
                    </motion.div>
                  )}

                  {helpSubTab === 'terms' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-sm prose-slate max-w-none text-slate-600">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Terms of Service</h3>
                      <p className="mb-4">Last Updated: May 2026</p>
                      <p className="mb-4">
                        Welcome to GradePro. By accessing our application, you agree to these Terms of Service.
                      </p>
                      <h4 className="font-semibold text-slate-800 mt-6 mb-2">1. Use of Service</h4>
                      <p className="mb-4">GradePro is designed to help students track and predict their academic standing. You agree to use the service for personal academic purposes only.</p>
                      <h4 className="font-semibold text-slate-800 mt-6 mb-2">2. User Responsibilities</h4>
                      <p className="mb-4">You are responsible for keeping your account information secure. Any content or transcript data uploaded remains your responsibility.</p>
                      <h4 className="font-semibold text-slate-800 mt-6 mb-2">3. Disclaimer</h4>
                      <p>CGPA calculations and AI insights are purely informational. Please consult your official university transcripts for exact, authoritative academic standing.</p>
                    </motion.div>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
