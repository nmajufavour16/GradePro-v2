import React, { useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { calculateCGPA, calculateGPA } from '../utils/gpa';
import { useReactToPrint } from 'react-to-print';
import { Printer, Download, BookOpen, GraduationCap } from 'lucide-react';

export default function Report() {
  const { profile } = useAuth();
  const { semesters, courses } = useData();
  const componentRef = useRef<HTMLDivElement>(null);

  const cgpa = calculateCGPA(semesters, courses);
  const totalUnits = courses.reduce((acc, c) => acc + c.units, 0);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `${profile?.displayName || 'Student'}_GradePro_Report`,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Academic Report</h1>
          <p className="text-slate-600 mt-1">Generate and print your official GradePro report.</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Printer className="h-5 w-5 mr-2" />
          Print / Save as PDF
        </button>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
        <div ref={componentRef} className="max-w-4xl mx-auto bg-white p-8">
          {/* Report Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-6 mb-8">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-10 w-10 text-indigo-600" />
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">GradePro</h2>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Academic Report</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Date Generated</p>
              <p className="font-bold text-slate-900">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
              <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold mb-1">Student Name</p>
              <p className="text-xl font-bold text-slate-900">{profile?.displayName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold mb-1">Email</p>
              <p className="text-xl font-bold text-slate-900">{profile?.email}</p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="flex items-center justify-around bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-12">
            <div className="text-center">
              <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold mb-2">Cumulative GPA</p>
              <div className="flex items-center justify-center space-x-2">
                <GraduationCap className="h-8 w-8 text-indigo-600" />
                <span className="text-4xl font-black text-slate-900">{cgpa.toFixed(2)}</span>
              </div>
            </div>
            <div className="w-px h-16 bg-slate-200"></div>
            <div className="text-center">
              <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold mb-2">Total Units</p>
              <span className="text-4xl font-black text-slate-900">{totalUnits}</span>
            </div>
            <div className="w-px h-16 bg-slate-200"></div>
            <div className="text-center">
              <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold mb-2">Semesters</p>
              <span className="text-4xl font-black text-slate-900">{semesters.length}</span>
            </div>
          </div>

          {/* Semester Breakdown */}
          <div className="space-y-10">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">Academic Record</h3>
            
            {semesters.length === 0 ? (
              <p className="text-slate-500 italic">No academic records found.</p>
            ) : (
              semesters.map(semester => {
                const semesterCourses = courses.filter(c => c.semesterId === semester.id);
                const gpa = calculateGPA(semesterCourses);
                const sUnits = semesterCourses.reduce((acc, c) => acc + c.units, 0);

                return (
                  <div key={semester.id} className="break-inside-avoid">
                    <div className="flex items-center justify-between bg-slate-100 px-4 py-2 rounded-t-xl border border-slate-200 border-b-0">
                      <h4 className="font-bold text-slate-900">{semester.level} - {semester.name}</h4>
                      <div className="text-sm font-semibold text-slate-700">
                        GPA: <span className="text-indigo-600">{gpa.toFixed(2)}</span> | Units: {sUnits}
                      </div>
                    </div>
                    <table className="w-full text-left border-collapse border border-slate-200">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200">Course Code</th>
                          <th className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200">Title</th>
                          <th className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center border-r border-slate-200">Units</th>
                          <th className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center border-r border-slate-200">Grade</th>
                          <th className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Points</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {semesterCourses.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-4 text-center text-sm text-slate-500 italic">No courses recorded.</td>
                          </tr>
                        ) : (
                          semesterCourses.map(course => (
                            <tr key={course.id}>
                              <td className="px-4 py-2 text-sm font-bold text-slate-900 border-r border-slate-200">{course.code}</td>
                              <td className="px-4 py-2 text-sm text-slate-700 border-r border-slate-200">{course.title || '-'}</td>
                              <td className="px-4 py-2 text-sm text-center font-medium text-slate-900 border-r border-slate-200">{course.units}</td>
                              <td className="px-4 py-2 text-sm text-center font-bold text-slate-900 border-r border-slate-200">{course.grade}</td>
                              <td className="px-4 py-2 text-sm text-center font-medium text-slate-900">{(course.gradePoint * course.units).toFixed(1)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-16 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
            <p>This document is generated by GradePro AI and serves as an unofficial academic record.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
