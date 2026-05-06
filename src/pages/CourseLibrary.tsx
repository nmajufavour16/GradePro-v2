import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CourseReview, AppMetadata, CourseMaterial, CommunityCourse } from '../types';
import { collection, query, where, onSnapshot, addDoc, doc, getDoc, orderBy, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError } from '../utils/firebaseErrors';
import { OperationType } from '../types';
import { Search, Star, MessageSquare, Info, Sparkles, Filter, Users, BookOpen, Plus, ExternalLink, FileText, Download, Trash2, X, PlusCircle, LayoutGrid, List, TrendingUp, Settings, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';

export default function CourseLibrary() {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [communityCourses, setCommunityCourses] = useState<CommunityCourse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [aiTips, setAiTips] = useState<string | null>(null);
  const [isGeneratingTips, setIsGeneratingTips] = useState(false);
  const [metadata, setMetadata] = useState<AppMetadata | null>(null);

  // Form states
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    difficulty: 3,
    comment: '',
    tips: '',
    isAnonymous: false
  });

  const [materialForm, setMaterialForm] = useState({
    title: '',
    type: 'Note' as any,
    url: '',
    description: ''
  });

  const [courseForm, setCourseForm] = useState({
    code: '',
    title: '',
    units: 3
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      const docRef = doc(db, 'metadata', 'app-config');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setMetadata(docSnap.data() as AppMetadata);
    };
    fetchMetadata();

    const unsubReviews = onSnapshot(query(collection(db, 'courseReviews'), orderBy('createdAt', 'desc')), (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseReview)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'courseReviews');
    });

    const unsubMaterials = onSnapshot(query(collection(db, 'courseMaterials'), orderBy('createdAt', 'desc')), (snapshot) => {
      setMaterials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseMaterial)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'courseMaterials');
    });

    const unsubCourses = onSnapshot(query(collection(db, 'communityCourses'), orderBy('createdAt', 'desc')), (snapshot) => {
      setCommunityCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityCourse)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'communityCourses');
    });

    return () => {
      unsubReviews();
      unsubMaterials();
      unsubCourses();
    };
  }, []);

  const generateAITips = async (courseCode: string) => {
    setIsGeneratingTips(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        Provide a comprehensive "Performance Optimization Guide" for the university course code "${courseCode}".
        Include:
        1. Difficulty Rating (1-5) and why.
        2. High-Yield Topics: Which areas usually carry the most marks.
        3. 3 Practical Study Strategies specific to this type of course.
        4. Resource Recommendation: What kind of external resources help (e.g. YouTube channels, specific textbooks).
        
        Use clear headings and professional yet encouraging tone. Use markdown.
      `;
      const result = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      setAiTips(result.text || '');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingTips(false);
    }
  };

  const handleAddReview = async () => {
    if (!selectedCourse || !user) return;
    try {
      await addDoc(collection(db, 'courseReviews'), {
        ...reviewForm,
        courseCode: selectedCourse,
        userId: user.uid,
        userName: reviewForm.isAnonymous ? 'Anonymous Student' : profile?.displayName || 'GradePro User',
        createdAt: new Date().toISOString()
      });
      setIsAddingReview(false);
      setReviewForm({ rating: 5, difficulty: 3, comment: '', tips: '', isAnonymous: false });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'courseReviews');
    }
  };

  const handleAddMaterial = async () => {
    if (!selectedCourse || !user) return;
    try {
      await addDoc(collection(db, 'courseMaterials'), {
        ...materialForm,
        courseCode: selectedCourse,
        userId: user.uid,
        userName: profile?.displayName || 'GradePro User',
        createdAt: new Date().toISOString()
      });
      setIsAddingMaterial(false);
      setMaterialForm({ title: '', type: 'Note', url: '', description: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'courseMaterials');
    }
  };

  const handleAddCourse = async () => {
    if (!user) return;
    try {
      if (editingCourseId) {
        await updateDoc(doc(db, 'communityCourses', editingCourseId), {
          ...courseForm,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'communityCourses'), {
          ...courseForm,
          institution: profile?.institution,
          department: profile?.department,
          addedBy: user.uid,
          createdAt: new Date().toISOString()
        });
      }
      setIsAddingCourse(false);
      setEditingCourseId(null);
      setCourseForm({ code: '', title: '', units: 3 });
    } catch (err) {
      handleFirestoreError(err, editingCourseId ? OperationType.UPDATE : OperationType.CREATE, 'communityCourses');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this course from the community library?')) return;
    try {
      await deleteDoc(doc(db, 'communityCourses', id));
      setSelectedCourse(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `communityCourses/${id}`);
    }
  };

  const allCourses = [
    ...(metadata?.courseTemplates || []),
    ...communityCourses.map(c => ({ code: c.code, title: c.title, units: c.units, id: c.id, addedBy: c.addedBy }))
  ];

  // Unique by code, prioritizing community ones for same code if they have IDs
  const uniqueCoursesMap = new Map();
  allCourses.forEach(c => {
    if (!uniqueCoursesMap.has(c.code) || c.id) {
      uniqueCoursesMap.set(c.code, c);
    }
  });
  const uniqueCourses = Array.from(uniqueCoursesMap.values());

  const filteredCourses = uniqueCourses.filter(t => 
    t.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 md:p-12 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h1 className="text-4xl font-bold mb-4">GradePro Library</h1>
            <p className="text-indigo-100 text-lg">
              The ultimate collaborative hub. Explore courses, read community reviews, and find study materials contributed by your peers.
            </p>
          </div>
          <button 
            onClick={() => setIsAddingCourse(true)}
            className="flex items-center px-6 py-3 bg-white text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Contribute Course
          </button>
        </div>
        <Users className="absolute -bottom-10 -right-10 h-64 w-64 text-white/10" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Search & Course List */}
        <div className="lg:w-1/3 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search code or title..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-3xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm font-medium"
            />
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col max-h-[70vh]">
            <h3 className="font-bold text-slate-900 flex items-center mb-4 uppercase tracking-tighter text-sm">
              <BookOpen className="h-4 w-4 mr-2 text-indigo-600 font-bold" />
              Catalogue
            </h3>
            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {filteredCourses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-sm italic">No courses found matching your search.</p>
                </div>
              ) : filteredCourses.map(t => (
                <button
                  key={t.code}
                  onClick={() => {
                    setSelectedCourse(t.code);
                    setAiTips(null);
                  }}
                  className={`w-full text-left p-4 rounded-2xl transition-all border ${selectedCourse === t.code ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg translate-x-1' : 'bg-slate-50 border-transparent hover:border-slate-200 text-slate-700'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg leading-tight uppercase tracking-tight">{t.code}</p>
                      <p className={`text-xs mt-1 ${selectedCourse === t.code ? 'text-indigo-100' : 'text-slate-500'}`}>{t.title}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${selectedCourse === t.code ? 'bg-white/20' : 'bg-slate-200 text-slate-600'}`}>{t.units} Units</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Course Details & Activity */}
        <div className="lg:w-2/3 space-y-8">
          {selectedCourse ? (
            <AnimatePresence mode="wait">
              <motion.div 
                key={selectedCourse}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8 pb-12"
              >
                {/* Course Header */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8">
                    <BookOpen className="h-24 w-24 text-slate-50" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <h2 className="text-4xl font-bold text-slate-900 uppercase tracking-tighter">{selectedCourse}</h2>
                        <p className="text-slate-500 font-medium text-lg">{uniqueCourses.find(c => c.code === selectedCourse)?.title}</p>
                        
                        {uniqueCourses.find(c => c.code === selectedCourse)?.addedBy === user?.uid && (
                          <div className="flex items-center space-x-3 mt-4">
                            <button 
                              onClick={() => {
                                const course = communityCourses.find(c => c.code === selectedCourse);
                                if (course) {
                                  setCourseForm({ code: course.code, title: course.title, units: course.units });
                                  setEditingCourseId(course.id);
                                  setIsAddingCourse(true);
                                }
                              }}
                              className="flex items-center text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit Listing
                            </button>
                            <button 
                              onClick={() => {
                                const course = communityCourses.find(c => c.code === selectedCourse);
                                if (course) handleDeleteCourse(course.id);
                              }}
                              className="flex items-center text-[10px] font-bold text-slate-400 hover:text-rose-600 uppercase tracking-widest transition-colors"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => generateAITips(selectedCourse)}
                          disabled={isGeneratingTips}
                          className="flex items-center px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                          {isGeneratingTips ? <Sparkles className="h-5 w-5 mr-2 animate-spin" /> : <Sparkles className="h-5 w-5 mr-2" />}
                          AI Study Plan
                        </button>
                      </div>
                    </div>

                    {aiTips && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="prose prose-sm max-w-none prose-indigo bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 mb-6">
                        <ReactMarkdown>{aiTips}</ReactMarkdown>
                      </motion.div>
                    )}

                    <div className="bg-slate-50 p-4 rounded-3xl flex items-center justify-around text-center">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Reviews</p>
                        <p className="text-xl font-bold text-slate-900">{reviews.filter(r => r.courseCode === selectedCourse).length}</p>
                      </div>
                      <div className="h-8 w-px bg-slate-200" />
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Materials</p>
                        <p className="text-xl font-bold text-slate-900">{materials.filter(m => m.courseCode === selectedCourse).length}</p>
                      </div>
                      <div className="h-8 w-px bg-slate-200" />
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Avg Rating</p>
                        <p className="text-xl font-bold text-emerald-600">
                          {reviews.filter(r => r.courseCode === selectedCourse).length > 0
                            ? (reviews.filter(r => r.courseCode === selectedCourse).reduce((acc, r) => acc + r.rating, 0) / reviews.filter(r => r.courseCode === selectedCourse).length).toFixed(1)
                            : '-'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs / Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                  {/* Reviews Section */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-900 flex items-center">
                        <MessageSquare className="h-5 w-5 mr-2 text-indigo-600" />
                        Community Reviews
                      </h3>
                      <button 
                        onClick={() => setIsAddingReview(true)}
                        className="p-1 px-3 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        Add Review
                      </button>
                    </div>

                    <div className="space-y-4">
                      {reviews.filter(r => r.courseCode === selectedCourse).length === 0 ? (
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center">
                          <p className="text-slate-400 italic text-sm">No reviews yet. Share your experience!</p>
                        </div>
                      ) : (
                        reviews.filter(r => r.courseCode === selectedCourse).map((r) => (
                          <motion.div layout key={r.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-1">
                                {[1,2,3,4,5].map(star => (
                                  <Star key={star} className={`h-3.5 w-3.5 ${star <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                ))}
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase">{r.userName}</span>
                            </div>
                            <p className="text-slate-700 text-sm font-medium italic">"{r.comment}"</p>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                              <p className="text-[10px] text-indigo-600 font-bold uppercase">Difficulty: {r.difficulty}/5</p>
                              <span className="text-[9px] text-slate-400 uppercase">{new Date(r.createdAt).toLocaleDateString()}</span>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Materials Section */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-900 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-rose-500" />
                        Study Materials
                      </h3>
                      <button 
                        onClick={() => setIsAddingMaterial(true)}
                        className="p-1 px-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg hover:bg-rose-100 transition-colors"
                      >
                        Contribute
                      </button>
                    </div>

                    <div className="space-y-3">
                      {materials.filter(m => m.courseCode === selectedCourse).length === 0 ? (
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center">
                          <p className="text-slate-400 italic text-sm">Help others! Upload a past question or link to your notes.</p>
                        </div>
                      ) : (
                        materials.filter(m => m.courseCode === selectedCourse).map((m) => (
                          <a 
                            href={m.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            key={m.id} 
                            className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 hover:border-rose-400 hover:shadow-md transition-all group"
                          >
                            <div className="flex items-center space-x-3 overflow-hidden">
                              <div className="p-2 bg-rose-50 rounded-lg group-hover:bg-rose-100 transition-colors">
                                <FileText className="h-4 w-4 text-rose-600" />
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-bold text-slate-900 truncate text-sm">{m.title}</p>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{m.type}</p>
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-rose-500" />
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-200 border-dashed p-12 text-center group">
              <div className="relative mb-8">
                <BookOpen className="h-24 w-24 text-slate-100 group-hover:text-indigo-100 transition-colors group-hover:scale-110 duration-500" />
                <PlusCircle className="absolute -bottom-2 -right-2 h-10 w-10 text-slate-50 transition-colors group-hover:text-indigo-200" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tighter mb-4">Select a Knowledge Base</h3>
              <p className="text-slate-500 mt-2 max-w-sm font-medium leading-relaxed">
                Dive into specific courses to find student reviews, AI-generated success guides, and peer-contributed study materials.
              </p>
              <div className="mt-12 flex items-center justify-center gap-2">
                <div className="flex -space-x-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-10 w-10 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      GP
                    </div>
                  ))}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">Join 2,400+ Students</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {isAddingCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tighter">{editingCourseId ? 'Edit Course' : 'Contribute Course'}</h2>
                  <button onClick={() => { setIsAddingCourse(false); setEditingCourseId(null); }}><X className="h-6 w-6 text-slate-400 hover:text-slate-600" /></button>
                </div>
                <p className="text-slate-500 text-sm">
                  {editingCourseId ? 'Update this course\'s information for the community.' : 'Add a standard course to the library that others can benefit from.'}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Course Code</label>
                    <input 
                      type="text" 
                      placeholder="e.g. CSC 201" 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold uppercase tracking-widest"
                      value={courseForm.code}
                      onChange={e => setCourseForm({...courseForm, code: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Full Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Algorithms & Data Structures" 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                      value={courseForm.title}
                      onChange={e => setCourseForm({...courseForm, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Credit Units</label>
                    <input 
                      type="number" 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                      value={courseForm.units}
                      onChange={e => setCourseForm({...courseForm, units: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <button 
                  onClick={handleAddCourse}
                  disabled={!courseForm.code || !courseForm.title}
                  className="w-full py-5 bg-indigo-600 text-white font-bold rounded-3xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50 mt-4"
                >
                  {editingCourseId ? 'Update Listing' : 'Publish to Library'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isAddingReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tighter">Student Review</h2>
                    <button onClick={() => setIsAddingReview(false)}><X className="h-6 w-6 text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Rating</label>
                      <div className="flex space-x-2">
                        {[1,2,3,4,5].map(s => (
                          <button key={s} onClick={() => setReviewForm({...reviewForm, rating: s})}><Star className={`h-8 w-8 ${s <= reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} /></button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Difficulty level (1-5)</label>
                      <input type="range" min="1" max="5" value={reviewForm.difficulty} onChange={e => setReviewForm({...reviewForm, difficulty: parseInt(e.target.value)})} className="w-full accent-indigo-600" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Experience</label>
                      <textarea 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium h-24 resize-none"
                        placeholder="What was the course like? (Lecturers, exams, etc.)"
                        value={reviewForm.comment}
                        onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Pro Prep Tip</label>
                      <input 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs italic"
                        placeholder="e.g. Focus on Chapter 4 for midterms"
                        value={reviewForm.tips}
                        onChange={e => setReviewForm({...reviewForm, tips: e.target.value})}
                      />
                    </div>
                    <label className="flex items-center space-x-2 cursor-pointer pt-2">
                      <input type="checkbox" checked={reviewForm.isAnonymous} onChange={e => setReviewForm({...reviewForm, isAnonymous: e.target.checked})} className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm font-bold text-slate-600 uppercase tracking-wider text-[10px]">Post Anonymously</span>
                    </label>
                  </div>
                  <button 
                    onClick={handleAddReview}
                    disabled={!reviewForm.comment}
                    className="w-full py-5 bg-indigo-600 text-white font-bold rounded-3xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50"
                  >
                    Post Experience
                  </button>
                </div>
             </motion.div>
          </div>
        )}

        {isAddingMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tighter">Share Resource</h2>
                    <button onClick={() => setIsAddingMaterial(false)}><X className="h-6 w-6 text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Resource Title</label>
                      <input 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                        placeholder="e.g. CSC 201 Past Questions 2023"
                        value={materialForm.title}
                        onChange={e => setMaterialForm({...materialForm, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Category</label>
                      <select 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                        value={materialForm.type}
                        onChange={e => setMaterialForm({...materialForm, type: e.target.value as any})}
                      >
                        <option value="Note">Note / Summary</option>
                        <option value="Past Question">Past Question</option>
                        <option value="Textbook">Textbook</option>
                        <option value="Video">Video Link</option>
                        <option value="Link">External Resource</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">URL (Drive, Cloud, etc.)</label>
                      <input 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-indigo-600 font-bold"
                        placeholder="https://drive.google.com/..."
                        value={materialForm.url}
                        onChange={e => setMaterialForm({...materialForm, url: e.target.value})}
                      />
                    </div>
                  </div>
                  <button 
                  onClick={handleAddMaterial}
                  disabled={!materialForm.title || !materialForm.url}
                  className="w-full py-5 bg-rose-600 text-white font-bold rounded-3xl hover:bg-rose-700 transition-all shadow-xl shadow-rose-100 active:scale-95 disabled:opacity-50 mt-4"
                >
                  Share Repository
                </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
