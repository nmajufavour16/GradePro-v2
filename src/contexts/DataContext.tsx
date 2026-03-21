import React, { createContext, useContext, useEffect, useState } from 'react';
import { Semester, Course } from '../types';
import { useAuth } from './AuthContext';

interface DataContextType {
  semesters: Semester[];
  courses: Course[];
  loading: boolean;
  addSemester: (data: Omit<Semester, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateSemester: (id: string, data: Partial<Semester>) => Promise<void>;
  deleteSemester: (id: string) => Promise<void>;
  addCourse: (data: Omit<Course, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateCourse: (id: string, data: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) {
      setSemesters([]);
      setCourses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [semRes, courRes] = await Promise.all([
        fetch('/api/semesters'),
        fetch('/api/courses')
      ]);

      if (semRes.ok && courRes.ok) {
        const semData = await semRes.json();
        const courData = await courRes.json();
        setSemesters(semData);
        setCourses(courData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const addSemester = async (data: Omit<Semester, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    try {
      const res = await fetch('/api/semesters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const newSem = await res.json();
        setSemesters(prev => [...prev, newSem]);
      }
    } catch (error) {
      console.error('Error adding semester:', error);
    }
  };

  const updateSemester = async (id: string, data: Partial<Semester>) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/semesters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setSemesters(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
      }
    } catch (error) {
      console.error('Error updating semester:', error);
    }
  };

  const deleteSemester = async (id: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/semesters/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSemesters(prev => prev.filter(s => s.id !== id));
        setCourses(prev => prev.filter(c => c.semesterId !== id));
      }
    } catch (error) {
      console.error('Error deleting semester:', error);
    }
  };

  const addCourse = async (data: Omit<Course, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const newCourse = await res.json();
        setCourses(prev => [...prev, newCourse]);
      }
    } catch (error) {
      console.error('Error adding course:', error);
    }
  };

  const updateCourse = async (id: string, data: Partial<Course>) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setCourses(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      }
    } catch (error) {
      console.error('Error updating course:', error);
    }
  };

  const deleteCourse = async (id: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCourses(prev => prev.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  return (
    <DataContext.Provider value={{
      semesters, courses, loading,
      addSemester, updateSemester, deleteSemester,
      addCourse, updateCourse, deleteCourse
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
