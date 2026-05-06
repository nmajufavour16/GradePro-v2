export interface User {
  uid: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  targetCGPA?: number;
  gradingScale?: number;
  institution?: string;
  faculty?: string;
  department?: string;
  level?: string;
  role?: 'admin' | 'user';
  hasCompletedTour?: boolean;
  createdAt?: string;
}

export interface AppMetadata {
  id: string;
  institutions: string[];
  faculties: string[];
  departments: string[];
  courseTemplates: {
    code: string;
    title: string;
    units: number;
  }[];
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  isThinking?: boolean;
  createdAt: string;
}

export interface Semester {
  id: string;
  userId: string;
  level: string;
  name: string;
  createdAt?: string;
}

export interface Assessment {
  id: string;
  title: string;
  type: 'Test' | 'Assignment' | 'Exam' | 'Project' | 'Other';
  weight: number; 
  score?: number;
  dueDate?: string;
  isCompleted: boolean;
}

export interface Course {
  id: string;
  userId: string;
  semesterId: string;
  code: string;
  title?: string;
  units: number;
  grade: string;
  score?: number;
  gradePoint: number;
  isCarryover?: boolean;
  category?: 'General' | 'Core' | 'Elective' | 'Practical';
  assessments?: Assessment[];
  createdAt?: string;
}

export interface CourseReview {
  id: string;
  courseCode: string;
  userId: string;
  userName?: string;
  rating: number;
  difficulty: number; // 1-5
  comment: string;
  tips: string;
  isAnonymous: boolean;
  createdAt: string;
}

export interface CourseMaterial {
  id: string;
  courseCode: string;
  userId: string;
  userName?: string;
  title: string;
  type: 'Note' | 'Past Question' | 'Textbook' | 'Video' | 'Link';
  url: string; // Could be a drive link or actual file URL
  description?: string;
  createdAt: string;
}

export interface CommunityCourse {
  id: string;
  code: string;
  title: string;
  units: number;
  department?: string;
  institution?: string;
  addedBy: string;
  createdAt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}
