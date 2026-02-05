import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase';
import api from '../../api.js';

interface BackendProfile { _id: string; firebaseUid: string; role?: 'user' | 'admin' | 'guide'; name?: string; email?: string; }
interface AuthValue {
  user: FirebaseUser | null;
  loading: boolean;
  profile: BackendProfile | null;
  role: 'user' | 'admin' | 'guide';
}
const Ctx = createContext<AuthValue>({ user: null, loading: true, profile: null, role: 'user' });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BackendProfile | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const token = await u.getIdToken();
          const me = await api.get('/me', { auth: token });
          setProfile(me.user || null);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const role = (profile?.role || 'user') as 'user' | 'admin' | 'guide';
  return <Ctx.Provider value={{ user, loading, profile, role }}>{children}</Ctx.Provider>;
};

export function useAuth() {
  return useContext(Ctx);
}
