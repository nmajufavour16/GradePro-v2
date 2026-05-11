import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CourseReview, AppMetadata, CourseMaterial, CommunityCourse, CourseReviewReply } from '../types';
import { collection, query, where, onSnapshot, addDoc, doc, getDoc, orderBy, serverTimestamp, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { handleFirestoreError } from '../utils/firebaseErrors';
import { OperationType } from '../types';
import { Search, Star, MessageSquare, Info, Sparkles, Filter, Users, BookOpen, Plus, ExternalLink, FileText, Download, Trash2, X, PlusCircle, LayoutGrid, List, TrendingUp, Settings, Edit2, Heart, CornerDownRight, MoreVertical } from 'lucide-react';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [courseForm, setCourseForm] = useState({
    code: '',
    title: '',
    units: 3
  });

  const [replies, setReplies] = useState<CourseReviewReply[]>([]);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [replyForms, setReplyForms] = useState<Record<string, string>>({}); // reviewId -> replyContent
  const [showReplyInput, setShowReplyInput] = useState<Record<string, boolean>>({});

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

    const unsubReplies = onSnapshot(query(collection(db, 'courseReviewReplies'), orderBy('createdAt', 'asc')), (snapshot) => {
      setReplies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseReviewReply)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'courseReviewReplies');
    });

    // Ask for Notification Permissions
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      unsubReviews();
      unsubMaterials();
      unsubCourses();
      unsubReplies();
    };
  }, []);

  const generateAITips = async (courseCode: string) => {
    setIsGeneratingTips(true);
    setAiTips(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
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
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      setAiTips(result.text || '');
    } catch (err: any) {
      console.error("AI Tips Error:", err);
      setAiTips(`**Error generating AI Study Plan:** ${err.message || String(err)}`);
    } finally {
      setIsGeneratingTips(false);
    }
  };

  const handleAddReview = async () => {
    if (!selectedCourse || !user) return;
    try {
      if (editingReviewId) {
        await updateDoc(doc(db, 'courseReviews', editingReviewId), {
          ...reviewForm,
          userName: reviewForm.isAnonymous ? 'Anonymous Student' : profile?.displayName || 'GradePro User',
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'courseReviews'), {
          ...reviewForm,
          courseCode: selectedCourse,
          userId: user.uid,
          userName: reviewForm.isAnonymous ? 'Anonymous Student' : profile?.displayName || 'GradePro User',
          createdAt: new Date().toISOString(),
          likes: []
        });
      }
      setIsAddingReview(false);
      setEditingReviewId(null);
      setReviewForm({ rating: 5, difficulty: 3, comment: '', tips: '', isAnonymous: false });
    } catch (err) {
      handleFirestoreError(err, editingReviewId ? OperationType.UPDATE : OperationType.CREATE, 'courseReviews');
    }
  };

  const handleAddMaterial = async () => {
    if (!selectedCourse || !user) return;
    
    // If a URL is manually provided, use that, else if file upload is done, use that
    if (!materialForm.url && !selectedFile) {
      alert("Please provide a URL or upload a file.");
      return;
    }

    try {
      setIsUploading(true);
      let fileUrl = materialForm.url;

      if (selectedFile) {
        // Upload file to Firebase Storage
        const fileRef = ref(storage, `courseMaterials/${selectedCourse}/${Date.now()}_${selectedFile.name}`);
        const uploadTask = uploadBytesResumable(fileRef, selectedFile);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error('Upload failed:', error);
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              fileUrl = downloadURL;
              resolve(null);
            }
          );
        });
      }

      await addDoc(collection(db, 'courseMaterials'), {
        ...materialForm,
        url: fileUrl,
        courseCode: selectedCourse,
        userId: user.uid,
        userName: profile?.displayName || 'GradePro User',
        createdAt: new Date().toISOString()
      });
      setIsAddingMaterial(false);
      setMaterialForm({ title: '', type: 'Note', url: '', description: '' });
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('unauthorized')) {
        alert("Upload failed. Firebase Storage rules might restrict uploads. Please check your Firebase Storage security rules.");
      } else {
        handleFirestoreError(err, OperationType.CREATE, 'courseMaterials');
      }
    } finally {
      setIsUploading(false);
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

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'review' | 'reply' | 'course' } | null>(null);

  const performDelete = async () => {
    if (!deleteConfirm) return;
    const { id, type } = deleteConfirm;
    
    if (type === 'course') {
      setDeleteConfirm(null);
      try {
        await deleteDoc(doc(db, 'communityCourses', id));
        setSelectedCourse(null);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `communityCourses/${id}`);
      }
    } else if (type === 'review') {
      setDeleteConfirm(null);
      setDeletingReviewId(id);
      try {
        await deleteDoc(doc(db, 'courseReviews', id));
        setIsAddingReview(false);
        setEditingReviewId(null);
        setReviewForm({ rating: 5, difficulty: 3, comment: '', tips: '', isAnonymous: false });
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `courseReviews/${id}`);
      } finally {
        setDeletingReviewId(null);
      }
    } else if (type === 'reply') {
      setDeleteConfirm(null);
      try {
        await deleteDoc(doc(db, 'courseReviewReplies', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `courseReviewReplies/${id}`);
      }
    }
  };

  const handleDeleteCourse = async (id: string) => {
    setDeleteConfirm({ id, type: 'course' });
  };

  const handleDeleteReview = async (id: string) => {
    setDeleteConfirm({ id, type: 'review' });
  };

  const handleDeleteReply = async (id: string) => {
    setDeleteConfirm({ id, type: 'reply' });
  };

  const handleEditReviewInit = (review: CourseReview) => {
    setReviewForm({
      rating: review.rating,
      difficulty: review.difficulty,
      comment: review.comment,
      tips: review.tips,
      isAnonymous: review.isAnonymous
    });
    setEditingReviewId(review.id);
    setIsAddingReview(true);
  };

  const handleLikeReview = async (review: CourseReview) => {
    if (!user) return;
    try {
      const reviewRef = doc(db, 'courseReviews', review.id);
      const isLiked = review.likes && review.likes.includes(user.uid);
      await updateDoc(reviewRef, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });

      // Send notification if it's a new like and not the owner's review
      if (!isLiked && review.userId !== user.uid) {
        await addDoc(collection(db, 'notifications'), {
          userId: review.userId,
          type: 'like',
          message: `${profile?.displayName || 'Someone'} liked your review on ${review.courseCode}.`,
          read: false,
          relatedId: review.id,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `courseReviews/${review.id}`);
    }
  };

  const handleAddReply = async (reviewId: string, reviewUserId: string, courseCode: string) => {
    if (!user) return;
    const content = replyForms[reviewId]?.trim();
    if (!content) return;
    try {
      await addDoc(collection(db, 'courseReviewReplies'), {
        reviewId,
        userId: user.uid,
        userName: profile?.displayName || 'GradePro User',
        content,
        createdAt: new Date().toISOString()
      });
      setReplyForms({ ...replyForms, [reviewId]: '' });
      setShowReplyInput({ ...showReplyInput, [reviewId]: false });

      if (user.uid !== reviewUserId) {
        await addDoc(collection(db, 'notifications'), {
          userId: reviewUserId,
          type: 'reply',
          message: `${profile?.displayName || 'Someone'} replied to your review on ${courseCode}.`,
          read: false,
          relatedId: reviewId,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'courseReviewReplies');
    }
  };

  const allCourses = [
    ...(metadata?.courseTemplates || []),
    ...communityCourses.map(c => ({ code: c.code, title: c.title, units: c.units, id: c.id, addedBy: c.addedBy }))
  ];

  // Unique by code, prioritizing community ones for same code if they have IDs
  const uniqueCoursesMap = new Map();
  allCourses.forEach(c => {
    if (!uniqueCoursesMap.has(c.code) || (c as any).id) {
      uniqueCoursesMap.set(c.code, c);
    }
  });
  const uniqueCourses = Array.from(uniqueCoursesMap.values());

  const filteredCourses = uniqueCourses.filter(t => 
    t.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
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
              ) : filteredCourses.map((t, index) => (
                <button
                  key={`${t.code}-${(t as any).id || index}`}
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
                        <AnimatePresence mode="popLayout">
                          {reviews.filter(r => r.courseCode === selectedCourse).map((r) => {
                            const isMine = r.userId === user?.uid;
                            const hasLiked = user && r.likes && r.likes.includes(user.uid);
                            const courseReplies = replies.filter(reply => reply.reviewId === r.id);
                            const isDeleting = deletingReviewId === r.id;

                            return (
                            <motion.div 
                              layout 
                              key={r.id} 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: isDeleting ? 0.3 : 1, y: 0, scale: isDeleting ? 0.95 : 1 }}
                              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden"
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className={`h-3.5 w-3.5 ${star <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                  ))}
                                </div>
                                <div className="flex space-x-2 items-center">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">{r.userName}</span>
                                  {isMine && (
                                    <div className="relative group ml-1">
                                      <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                                        <MoreVertical className="w-4 h-4" />
                                      </button>
                                      <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden flex flex-col">
                                        <button type="button" onClick={() => handleEditReviewInit(r)} disabled={isDeleting} className="px-3 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 w-full disabled:opacity-50 flex items-center space-x-2 transition-colors">
                                          <Edit2 className="w-3.5 h-3.5" /> <span>Edit</span>
                                        </button>
                                        <div className="h-px bg-slate-50 w-full" />
                                        <button type="button" onClick={() => handleDeleteReview(r.id)} disabled={isDeleting} className="px-3 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 w-full disabled:opacity-50 flex items-center space-x-2 transition-colors">
                                          <Trash2 className="w-3.5 h-3.5" /> <span>Delete</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <p className="text-slate-700 text-sm font-medium italic">"{r.comment}"</p>
                              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                <p className="text-[10px] text-indigo-600 font-bold uppercase">Difficulty: {r.difficulty}/5</p>
                                <div className="flex items-center space-x-4 text-[10px] uppercase text-slate-400">
                                  <button type="button" className="flex items-center space-x-1.5 hover:text-slate-600 transition-colors" onClick={() => setShowReplyInput({...showReplyInput, [r.id]: !showReplyInput[r.id]})}>
                                    <MessageSquare className="w-4 h-4" />
                                    <span className="font-bold text-sm tracking-widest">{courseReplies.length}</span>
                                  </button>
                                  <button type="button" className={`flex items-center space-x-1.5 transition-colors ${hasLiked ? 'text-rose-500' : 'hover:text-rose-500'}`} onClick={() => handleLikeReview(r)}>
                                    <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-500' : ''}`} />
                                    <span className="font-bold text-sm tracking-widest">{r.likes?.length || 0}</span>
                                  </button>
                                  <span className="font-medium">{new Date(r.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>

                              {/* Replies Section */}
                              <AnimatePresence>
                                {courseReplies.length > 0 && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pt-2 pl-3 space-y-2 border-l-2 border-slate-100 mt-4 text-xs">
                                    {courseReplies.map(reply => (
                                      <div key={reply.id} className="bg-slate-50 p-3 rounded-xl text-slate-600 group/reply relative">
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="font-bold text-[10px] text-slate-500 uppercase">{reply.userName}</span>
                                          {(reply.userId === user?.uid || profile?.role === 'admin') && (
                                            <button 
                                              type="button" 
                                              onClick={() => handleDeleteReply(reply.id)} 
                                              className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover/reply:opacity-100 transition-all absolute right-2 top-2"
                                              title="Delete reply"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                        <p className="pr-6">{reply.content}</p>
                                      </div>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Reply Input */}
                              <AnimatePresence>
                                {showReplyInput[r.id] && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pt-2 mt-2 flex">
                                    <input 
                                      type="text" 
                                      className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-100 rounded-l-xl focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                                      placeholder="Write a reply..." 
                                      value={replyForms[r.id] || ''}
                                      onChange={(e) => setReplyForms({...replyForms, [r.id]: e.target.value})}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddReply(r.id, r.userId, r.courseCode);
                                      }}
                                    />
                                    <button 
                                      type="button"
                                      className="px-3 bg-indigo-600 text-white rounded-r-xl text-[10px] font-bold uppercase hover:bg-indigo-700 transition"
                                      onClick={() => handleAddReply(r.id, r.userId, r.courseCode)}
                                    >
                                      Reply
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                            );
                          })}
                        </AnimatePresence>
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
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tighter">
                      {editingReviewId ? 'Edit Review' : 'Student Review'}
                    </h2>
                    <button onClick={() => {
                      setIsAddingReview(false);
                      setEditingReviewId(null);
                      setReviewForm({ rating: 5, difficulty: 3, comment: '', tips: '', isAnonymous: false });
                    }}><X className="h-6 w-6 text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Rating</label>
                      <div className="flex space-x-2">
                        {[1,2,3,4,5].map(s => (
                          <button type="button" key={s} onClick={() => setReviewForm({...reviewForm, rating: s})}><Star className={`h-8 w-8 ${s <= reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} /></button>
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
                    {editingReviewId ? 'Save Changes' : 'Post Experience'}
                  </button>
                  
                  {editingReviewId && (
                    <button 
                      onClick={() => handleDeleteReview(editingReviewId)}
                      className="w-full py-5 border-2 border-rose-100 text-rose-600 font-bold rounded-3xl hover:bg-rose-50 hover:border-rose-200 transition-all active:scale-95 mt-2"
                    >
                      Delete Review
                    </button>
                  )}
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
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">URL or Upload File</label>
                      <input 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-indigo-600 font-bold mb-2"
                        placeholder="https://drive.google.com/..."
                        value={materialForm.url}
                        onChange={e => setMaterialForm({...materialForm, url: e.target.value})}
                        disabled={!!selectedFile}
                      />
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400 flex-shrink-0">OR</span>
                        <div className="relative w-full">
                          <input 
                            type="file" 
                            accept=".pdf,.doc,.docx"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setSelectedFile(e.target.files[0]);
                                setMaterialForm({...materialForm, url: ''}); // Clear URL if file selected
                              }
                            }}
                            disabled={!!materialForm.url}
                          />
                          <div className={`w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-xs font-bold ${materialForm.url ? 'opacity-50' : ''}`}>
                            {selectedFile ? selectedFile.name : 'Click to Browse (PDF, DOC)'}
                          </div>
                        </div>
                        {selectedFile && (
                          <button onClick={() => setSelectedFile(null)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-full">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      {uploadProgress > 0 && selectedFile && (
                        <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                  onClick={handleAddMaterial}
                  disabled={!materialForm.title || (!materialForm.url && !selectedFile) || isUploading}
                  className="w-full py-5 bg-rose-600 text-white font-bold rounded-3xl hover:bg-rose-700 transition-all shadow-xl shadow-rose-100 active:scale-95 disabled:opacity-50 mt-4"
                >
                  {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Share Repository'}
                </button>
                </div>
             </motion.div>
          </div>
        )}
        
        {deleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tighter">Are you sure?</h3>
              <p className="text-slate-500 font-medium">This action cannot be undone. Are you sure you want to delete this {deleteConfirm.type}?</p>
              <div className="flex space-x-3 pt-4">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={performDelete}
                  className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 active:scale-95"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
