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
  createdAt: string;
}

export interface Semester {
  id: string;
  userId: string;
  level: string;
  name: string;
  createdAt?: string;
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
  createdAt?: string;
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
