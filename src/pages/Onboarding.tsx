import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/firebase';
import { AppMetadata } from '@/src/types';
import { BookOpen, Loader2 } from 'lucide-react';

export default function Onboarding() {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<AppMetadata | null>(null);
  const [formData, setFormData] = useState({
    institution: profile?.institution || '',
    faculty: profile?.faculty || '',
    department: profile?.department || '',
    level: profile?.level || ''
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      const docRef = doc(db, 'metadata', 'app-config');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setMetadata({ id: docSnap.id, ...docSnap.data() } as AppMetadata);
      }
    };
    fetchMetadata();
  }, []);

  const LEVELS = ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level", "600 Level"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(formData);
      navigate('/dashboard');
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <BookOpen className="h-12 w-12 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Complete your profile
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Tell us a bit more about your academic journey
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="institution" className="block text-sm font-medium text-slate-700">
                Institution
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="institution"
                  list="institutions"
                  required
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g. University of Lagos"
                />
                <datalist id="institutions">
                  {metadata?.institutions.map(inst => <option key={inst} value={inst} />)}
                </datalist>
              </div>
            </div>

            <div>
              <label htmlFor="faculty" className="block text-sm font-medium text-slate-700">
                Faculty
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="faculty"
                  list="faculties"
                  required
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g. Engineering"
                />
                <datalist id="faculties">
                  {metadata?.faculties.map(fac => <option key={fac} value={fac} />)}
                </datalist>
              </div>
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-slate-700">
                Department
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="department"
                  list="departments"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g. Computer Science"
                />
                <datalist id="departments">
                  {metadata?.departments.map(dep => <option key={dep} value={dep} />)}
                </datalist>
              </div>
            </div>

            <div>
              <label htmlFor="level" className="block text-sm font-medium text-slate-700">
                Level
              </label>
              <div className="mt-1">
                <select
                  id="level"
                  required
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="" disabled>Select your level</option>
                  {LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue to Dashboard'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
