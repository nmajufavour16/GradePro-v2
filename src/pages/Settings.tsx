import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Bell, Moon, Shield, Save, Loader2, AlertCircle, HelpCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';

type Tab = 'account' | 'notifications' | 'appearance' | 'help';

export default function Settings() {
  const { profile, updateProfile, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone and your data will be permanently lost.")) {
      return;
    }
    setIsDeleting(true);
    setMessage(null);
    try {
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await deleteDoc(userDocRef);
        await deleteUser(auth.currentUser);
        await logout();
      }
    } catch (error: any) {
      console.error('Delete account error:', error);
      if (error.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: 'Security requirement: Please log out and log back in, then try deleting your account again.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to delete account. Please try again later.' });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getTabClass = (tab: Tab) => {
    const isActive = activeTab === tab;
    return `w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${
      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
    }`;
  };

  const faqs = [
    { q: 'How is my CGPA calculated?', a: 'Your CGPA is calculated by dividing your total grade points by your total units across all semesters. The grade points for a course are determined by multiplying the units of the course by the point value of your grade based on your selected grading scale.' },
    { q: 'Can I change my grading scale later?', a: 'Yes! You can change your grading scale at any time from this Account Details settings page. All your past courses will automatically recalculate to fit the new scale.' },
    { q: 'How does the PDF transcript scanner work?', a: 'Our transcript scanner uses secure AI (Google Gemini) to read the text inside your PDF file and extract your course names, codes, units, and grades. The physical PDF is never permanently stored on our servers.' },
    { q: 'Can I export my transcript or data?', a: 'Currently, export functionality is limited. However, you can use the "Generate Academic Report" button on the Dashboard to get a text summary. We are actively working on adding full PDF transcript generation soon.' },
    { q: 'Is my data secure and private?', a: 'Yes! We use industry-standard encryption for your data via Google Firebase. Your personal grades and courses are entirely private to your account and cannot be seen by other users.' },
    { q: 'Who can see my course reviews?', a: 'Reviews added to the Community Course Library are public. However, if you prefer, you can check the "Post Anonymously" toggle when writing a review to hide your name from the public.' },
    { q: 'What is the GPA Simulator?', a: 'The GPA Simulator allows you to input "Target Grades" for your current semester to see how those grades would affect your overall CGPA. It\'s a sandbox feature that does not overwrite your actual grades until you confirm them.' },
    { q: 'Can I add a custom course that isn\'t in my department?', a: 'Yes! When adding a course, you can manually type any Course Code and Course Title. The autocomplete dropdown is just a helpful suggestion list, not a strict requirement.' },
    { q: 'How does GradePro AI give academic advice?', a: 'GradePro AI securely analyzes your past performance, trends across semesters, and your performance by subject categories (Core, General, Elective) to provide tailored coaching tips and predict your trajectory.' },
    { q: 'How do I contact support?', a: 'If you encounter any bugs or have feature requests, you can email us directly or check for updates on our official platforms.' },
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

                {/* Danger Zone */}
                <div className="mt-10 pt-8 border-t border-red-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-red-50 p-6 rounded-2xl border border-red-100">
                    <div>
                      <h3 className="text-lg font-bold text-red-900 flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        Danger Zone
                      </h3>
                      <p className="text-sm text-red-700 mt-1 max-w-lg">
                        Permanently delete your account and all of your content. This action is not reversible, so please continue with caution.
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="mt-4 sm:mt-0 flex items-center justify-center px-6 py-2.5 bg-white text-red-600 font-bold border border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-colors whitespace-nowrap shadow-sm disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete Account
                    </motion.button>
                  </div>
                </div>
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
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Privacy Policy</h3>
                      <p className="mb-6 text-slate-500">Last Updated: May 12, 2026</p>
                      
                      <p className="mb-4">
                        At GradePro, accessible from gradepro-v2.vercel.app, one of our main priorities is the privacy of our visitors and users. This Privacy Policy document contains types of information that is collected and recorded by GradePro and how we use it. If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.
                      </p>

                      <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mt-8 mb-4">1. Information We Collect</h4>
                      <p className="mb-4">We collect several different types of information for various purposes to provide and improve our Service to you.</p>
                      <ul className="list-disc pl-5 mb-4">
                        <li><strong>Personal Data:</strong> Email address, First name and last name, Profile picture URL (via Google Authentication), Academic Information (Institution, Faculty, Department, Level, Grading Scale).</li>
                        <li><strong>Usage Data:</strong> Information that your browser sends whenever you visit our Service.</li>
                        <li><strong>Academic Data:</strong> Course details (codes, titles, units), Grades and assessment scores, Semester records and GPA data, Content from uploaded transcripts parsed via Google Gemini AI (files are processed but not permanently stored).</li>
                      </ul>

                      <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mt-8 mb-4">2. How We Use Your Data</h4>
                      <ul className="list-disc pl-5 mb-4">
                        <li>To provide and maintain our Service (e.g., calculating your exact CGPA)</li>
                        <li>To notify you about changes to our Service</li>
                        <li>To allow you to participate in interactive features of our Service (like the Community Library)</li>
                        <li>To provide customer support</li>
                        <li>To gather analysis or valuable information so that we can improve our Service</li>
                        <li>To generate personalized academic insights and coaching via our AI features</li>
                      </ul>

                      <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mt-8 mb-4">3. Third-Party Integrations & AI</h4>
                      <p className="mb-4">
                        <strong>Google Authentication:</strong> We use Google Authentication to securely sign you in. We only request basic profile information and do not have access to your Google Drive, Gmail, or other Google services.<br/><br/>
                        <strong>Google Gemini AI:</strong> GradePro utilizes Google's Gemini AI to parse uploaded academic transcripts and provide AI academic coaching. The AI models do not use your data to train their base models.
                      </p>

                      <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mt-8 mb-4">4. Data Security</h4>
                      <p className="mb-4">The security of your data is important to us. We use Google Firebase to securely store your data. Our Firestore database relies on stringent security rules to ensure that your private academic data can only be read and modified by you. However, remember that no method of transmission over the Internet is 100% secure.</p>

                      <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mt-8 mb-4">5. Public & Community Data</h4>
                      <p className="mb-4">GradePro features a "Community Course Library". If you choose to submit a course template, review, or study material to the community, that specific submission becomes publicly visible. Your private grades, semesters, assessments, and overall CGPA are never shared. You may choose to post course reviews anonymously.</p>

                      <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mt-8 mb-4">6. Deleting Your Data</h4>
                      <p className="mb-4">You have the right to request the deletion of your personal data by contacting us. Within the app, you retain full control to delete individual courses, semesters, reviews, and materials at any time.</p>
                      
                      <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mt-8 mb-4">7. Children's Privacy</h4>
                      <p className="mb-4">Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13.</p>

                      <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mt-8 mb-4">8. Changes to This Privacy Policy</h4>
                      <p className="mb-4">We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>
                    </motion.div>
                  )}

                  {helpSubTab === 'terms' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-sm prose-slate max-w-none text-slate-600">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Terms of Service</h3>
                      <p className="mb-6 text-slate-500">Last Updated: May 12, 2026</p>

                      <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mt-8 mb-4">1. Agreement to Terms</h4>
                      <p className="mb-4">By accessing or using GradePro (available at gradepro-v2.vercel.app and related domains), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>

                      <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mt-8 mb-4">2. Description of Service</h4>
                      <p className="mb-4">GradePro is an academic performance tracking and prediction tool designed primarily for students in Nigerian universities. Our services include CGPA calculation, course management, assessment tracking, GPA simulation, AI-guided academic insights, and a community library for course materials and reviews.</p>

                      <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mt-8 mb-4">3. User Accounts & Registration</h4>
                      <p className="mb-4">To access certain features of the Service, you must register for an account using Google Authentication. By registering, you agree to: Provide accurate information, maintain the security of your account, accept all responsibility for activities under your account. GradePro reserves the right to terminate accounts that violate these Terms.</p>

                      <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mt-8 mb-4">4. User Content & Community Guidelines</h4>
                      <p className="mb-4">Our service allows you to post content in the Community Course Library. You represent and warrant that the Content belongs to you, does not violate any rights, does not promote academic dishonesty, and is not unlawful or objectional. We reserve the right to monitor and edit or remove any Content.</p>

                      <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mt-8 mb-4">5. Intellectual Property</h4>
                      <p className="mb-4">The Service and its original content (excluding Content provided by users) are and will remain the exclusive property of GradePro and its licensors. Our trademarks may not be used without prior written consent.</p>

                      <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mt-8 mb-4">6. Academic Disclaimer</h4>
                      <p className="mb-4">GradePro is designed as a supplementary tool. The CGPA calculations, simulations, and AI recommendations are approximations based on your input and should not be considered official academic records. Always refer to your university's official grading systems and student portals for definitive academic standing.</p>

                      <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mt-8 mb-4">7. Limitation of Liability</h4>
                      <p className="mb-4">In no event shall GradePro or its affiliates be liable for any indirect, incidental, special, consequential or punitive damages resulting from your access to or use of the Service, any conduct of third parties, or unauthorized access to your transmissions.</p>

                      <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mt-8 mb-4">8. Governing Law</h4>
                      <p className="mb-4">These Terms shall be governed and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict of law provisions.</p>

                      <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mt-8 mb-4">9. Changes to Terms</h4>
                      <p className="mb-4">We reserve the right to modify or replace these Terms at any time. By continuing to access or use our Service after revisions become effective, you agree to be bound by the revised terms.</p>

                      <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mt-8 mb-4">10. Contact Us</h4>
                      <p className="mb-4">If you have any questions about these Terms, please contact us via the support channels provided in the application.</p>
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
