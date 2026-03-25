import React, { createContext, useContext, useEffect, useState } from 'react';
import { signInWithCredential, GoogleAuthProvider, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/src/firebase';
import { User, UserProfile, OperationType } from '@/src/types';
import { handleFirestoreError } from '@/src/utils/firebaseErrors';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isLoggingIn: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    fetchUser();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchUser();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        const userData = data.user;
        setUser(userData);
        
        if (data.firebaseToken) {
          try {
            // Sign in to Firebase using the Google ID token
            const credential = GoogleAuthProvider.credential(data.firebaseToken);
            await signInWithCredential(auth, credential);
          } catch (firebaseError) {
            console.error('Firebase auth error:', firebaseError);
          }
        }
        
        await fetchProfile(userData);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (currentUser: User) => {
    try {
      const docRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        // Force admin role for the specific email if not already set
        if (currentUser.email === 'nmajufavour16@gmail.com' && data.role !== 'admin') {
          data.role = 'admin';
          await setDoc(docRef, { 
            role: 'admin',
            uid: currentUser.uid,
            email: currentUser.email || ''
          }, { merge: true });
        }
        setProfile(data);
      } else {
        const newProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.name || '',
          photoURL: currentUser.picture || '',
          targetCGPA: 4.5,
          gradingScale: 5.0,
          role: currentUser.email === 'nmajufavour16@gmail.com' ? 'admin' : 'user',
          createdAt: new Date().toISOString()
        };
        await setDoc(docRef, newProfile);
        setProfile(newProfile);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
    }
  };

  const login = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/auth/url');
      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }
      const { url } = await response.json();
      
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const authWindow = window.open(
        url,
        'Google Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!authWindow) {
        alert('Please allow popups for this site to sign in.');
        setIsLoggingIn(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !profile) return;
    try {
      const updated = { ...profile, ...data };
      await setDoc(doc(db, 'users', user.uid), updated, { merge: true });
      setProfile(updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isLoggingIn, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
