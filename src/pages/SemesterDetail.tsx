import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import { AppMetadata } from '../types';
import { calculateGPA, getGradePoint } from '../utils/gpa';
import { ArrowLeft, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

export default function SemesterDetail() {
  const { id } = useParams<{ id: string }>();
  const { semesters, courses, addCourse, updateCourse, deleteCourse } = useData();
  const { profile } = useAuth();
  const [metadata, setMetadata] = useState<AppMetadata | null>(null);
  
  const semester = semesters.find(s => s.id === id);
  const semesterCourses = courses.filter(c => c.semesterId === id);
  const gpa = calculateGPA(semesterCourses);
  const totalUnits = semesterCourses.reduce((acc, c) => acc + c.units, 0);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    units: 3,
    grade: 'A',
    score: '',
    isCarryover: false
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      const docSnap = await getDoc(doc(db, 'metadata', 'app-config'));
      if (docSnap.exists()) {
        setMetadata(docSnap.data() as AppMetadata);
      }
    };
    fetchMetadata();
  }, []);

  const handleCodeChange = (code: string) => {
    const upperCode = code.toUpperCase();
    setFormData({ ...formData, code: upperCode });
    
    // Auto-fill title and units if template exists
    const template = metadata?.courseTemplates.find(t => t.code === upperCode);
    if (template) {
      setFormData(prev => ({
        ...prev,
        code: upperCode,
        title: template.title,
        units: template.units
      }));
    }
  };

  if (!semester) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-slate-900">Semester not found</h2>
        <Link to="/semesters" className="text-indigo-600 hover:underline mt-4 inline-block">Back to Semesters</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const gradePoint = getGradePoint(formData.grade, profile?.gradingScale || 5.0);
    
    const courseData: any = {
      code: formData.code,
      title: formData.title,
      units: formData.units,
      grade: formData.grade,
      gradePoint,
      isCarryover: formData.isCarryover
    };

    if (formData.score !== '') {
      courseData.score = Number(formData.score);
    } else if (editingId) {
      courseData.score = deleteField();
    }
    
    if (editingId) {
      await updateCourse(editingId, courseData);
      setEditingId(null);
    } else {
      await addCourse({
        semesterId: id!,
        ...courseData
      });
      setIsAdding(false);
    }
    
    setFormData({ code: '', title: '', units: 3, grade: 'A', score: '', isCarryover: false });
  };

  const handleEdit = (course: any) => {
    setFormData({
      code: course.code,
      title: course.title || '',
      units: course.units,
      grade: course.grade,
      score: course.score?.toString() || '',
      isCarryover: course.isCarryover || false
    });
    setEditingId(course.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4 mb-6">
        <Link to="/semesters" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">
              {semester.level}
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900">{semester.name}</h1>
          </div>
          <p className="text-slate-500 mt-1 font-medium">GPA: <span className="text-indigo-600 font-bold">{gpa.toFixed(2)}</span> • Units: {totalUnits}</p>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">Courses</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Course
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">{editingId ? 'Edit Course' : 'Add New Course'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Course Code</label>
              <input
                required
                type="text"
                list="course-templates"
                placeholder="e.g. MTH101"
                value={formData.code}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
              />
              <datalist id="course-templates">
                {metadata?.courseTemplates.map(t => <option key={t.code} value={t.code}>{t.title}</option>)}
              </datalist>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Title (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Calculus I"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Units</label>
              <input
                required
                type="number"
                min="0"
                max="10"
                value={formData.units}
                onChange={(e) => setFormData({ ...formData, units: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {['A', 'B', 'C', 'D', 'E', 'F'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center h-full pb-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isCarryover}
                  onChange={(e) => setFormData({ ...formData, isCarryover: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700">Carryover Course</span>
              </label>
            </div>
            <div className="lg:col-span-5 flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setFormData({ code: '', title: '', units: 3, grade: 'A', score: '', isCarryover: false });
                }}
                className="px-6 py-2 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              >
                {editingId ? 'Update Course' : 'Save Course'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Course Code</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-center">Units</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-center">Grade</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-center">Points</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {semesterCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No courses added yet.
                  </td>
                </tr>
              ) : (
                semesterCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{course.code}</span>
                        {course.isCarryover && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                            Carryover
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{course.title || '-'}</td>
                    <td className="px-6 py-4 text-center font-medium text-slate-900">{course.units}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                        ${course.grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                          course.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                          course.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                          course.grade === 'D' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }
                      `}>
                        {course.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-900">
                      {(course.gradePoint * course.units).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(course)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteCourse(course.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
