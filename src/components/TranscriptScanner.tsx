import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { scanTranscript } from '../utils/ai';
import { getGradePoint } from '../utils/gpa';
import { FileUp, Loader2, CheckCircle, AlertCircle, X, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface TranscriptScannerProps {
  onClose: () => void;
}

export default function TranscriptScanner({ onClose }: TranscriptScannerProps) {
  const { user } = useAuth();
  const { semesters, courses } = useData();
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File is too large. Please select a file under 5MB.');
        e.target.value = '';
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleScan = async () => {
    if (!file || !user) return;
    setIsScanning(true);
    setError(null);

    try {
      const base64 = await readFileAsBase64(file);
      const data = await scanTranscript(base64, file.type);
      if (data && data.semesters) {
        setResults(data);
      } else {
        throw new Error("Could not parse transcript data.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to scan transcript. If you attached an image/PDF, it might be too large or unclear. Please try again with a clear file under 5MB.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleImport = async () => {
    if (!results || !user) return;
    setIsScanning(true);

    try {
      for (const sem of results.semesters) {
        const semRef = await addDoc(collection(db, 'semesters'), {
          userId: user.uid,
          name: sem.name,
          level: sem.level,
          createdAt: new Date().toISOString()
        });

        for (const course of sem.courses) {
          await addDoc(collection(db, 'courses'), {
            userId: user.uid,
            semesterId: semRef.id,
            code: course.code,
            title: course.title,
            units: course.units || 3,
            grade: course.grade || 'A',
            gradePoint: getGradePoint(course.grade || 'A', profile?.gradingScale || 5.0),
            category: course.category || 'Core',
            createdAt: new Date().toISOString()
          });
        }
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to import transcript data.");
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
          <div>
            <h2 className="text-xl font-bold">AI Transcript Scanner</h2>
            <p className="text-indigo-100 text-sm">Upload your result slip to auto-fill your grades</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!results ? (
            <div className={`
              border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-colors
              ${file ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}
            `}>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                className="hidden"
              />
              
              <div className={`p-4 rounded-full mb-4 ${file ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                <FileUp className="h-10 w-10" />
              </div>

              {file ? (
                <div className="text-center">
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-500 mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <div className="flex space-x-3 justify-center">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 text-indigo-600 font-medium hover:bg-indigo-50 rounded-xl transition-colors"
                    >
                      Change File
                    </button>
                    <button 
                      onClick={handleScan}
                      disabled={isScanning}
                      className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center disabled:opacity-50"
                    >
                      {isScanning ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        'Start Scanning'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-semibold text-slate-900 mb-1">Select your transcript or result slip</p>
                  <p className="text-sm text-slate-500 mb-6">Supports PNG, JPG, or PDF</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    Browse Files
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 text-emerald-600 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <CheckCircle className="h-6 w-6" />
                <span className="font-bold">Scan Complete! We found {results.semesters.length} semesters.</span>
              </div>

              <div className="space-y-4">
                {results.semesters.map((sem: any, idx: number) => (
                  <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="bg-slate-50 p-3 flex justify-between items-center border-b border-slate-200">
                      <span className="font-bold text-slate-900">{sem.level} - {sem.name}</span>
                      <span className="text-xs font-medium text-slate-500 uppercase">{sem.courses.length} Courses</span>
                    </div>
                    <div className="p-3 bg-white">
                      <table className="w-full text-sm">
                        <thead className="text-left border-b border-slate-100">
                          <tr>
                            <th className="py-2 font-semibold text-slate-600">Code</th>
                            <th className="py-2 font-semibold text-slate-600">Title</th>
                            <th className="py-2 font-semibold text-slate-600 text-center">Cat.</th>
                            <th className="py-2 font-semibold text-slate-600 text-center">Unit</th>
                            <th className="py-2 font-semibold text-slate-600 text-center">Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {sem.courses.map((c: any, cidx: number) => (
                            <tr key={cidx}>
                              <td className="py-2 font-medium text-slate-900">{c.code}</td>
                              <td className="py-2 text-slate-500 truncate max-w-[150px]">{c.title}</td>
                              <td className="py-2 text-center text-[10px] font-bold text-indigo-400 uppercase">{c.category || 'Core'}</td>
                              <td className="py-2 text-center text-slate-900 font-medium">{c.units}</td>
                              <td className="py-2 text-center">
                                <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold">
                                  {c.grade}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setResults(null)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                >
                  Discard
                </button>
                <button 
                  onClick={handleImport}
                  disabled={isScanning}
                  className="flex-[2] px-4 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center"
                >
                  {isScanning ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Import All Courses'
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-3 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100"
            >
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
