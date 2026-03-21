import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Semester, Course, OperationType } from '../types';
import { useAuth } from './AuthContext';
import { handleFirestoreError } from '../utils/firebaseErrors';

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

  useEffect(() => {
    if (!user) {
      setSemesters([]);
      setCourses([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const qSemesters = query(collection(db, 'semesters'), where('userId', '==', user.uid));
    const unsubSemesters = onSnapshot(qSemesters, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Semester));
      // Sort by creation date or level
      data.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      setSemesters(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'semesters');
    });

    const qCourses = query(collection(db, 'courses'), where('userId', '==', user.uid));
    const unsubCourses = onSnapshot(qCourses, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      setCourses(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'courses');
    });

    return () => {
      unsubSemesters();
      unsubCourses();
    };
  }, [user]);

  const addSemester = async (data: Omit<Semester, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'semesters'), {
        ...data,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'semesters');
    }
  };

  const updateSemester = async (id: string, data: Partial<Semester>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'semesters', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `semesters/${id}`);
    }
  };

  const deleteSemester = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'semesters', id));
      // Also delete associated courses
      const semesterCourses = courses.filter(c => c.semesterId === id);
      for (const course of semesterCourses) {
        await deleteDoc(doc(db, 'courses', course.id));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `semesters/${id}`);
    }
  };

  const addCourse = async (data: Omit<Course, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'courses'), {
        ...data,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'courses');
    }
  };

  const updateCourse = async (id: string, data: Partial<Course>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'courses', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `courses/${id}`);
    }
  };

  const deleteCourse = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'courses', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `courses/${id}`);
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
