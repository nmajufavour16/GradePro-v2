export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  targetCGPA?: number;
  gradingScale?: number;
  createdAt?: string;
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
