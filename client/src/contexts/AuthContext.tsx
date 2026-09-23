import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { student } from '../data/mockData';

type AuthUser = typeof student & { role: 'student' | 'admin' };
type AuthContextValue = { user: AuthUser | null; login: (email: string, role?: 'student' | 'admin') => void; register: (name: string, email: string) => void; logout: () => void };

const AuthContext = createContext<AuthContextValue | null>(null);
const storageKey = 'learnai-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { return null; }
  });

  useEffect(() => {
    if (user) localStorage.setItem(storageKey, JSON.stringify(user));
    else localStorage.removeItem(storageKey);
  }, [user]);

  const value = useMemo(() => ({
    user,
    login: (email: string, role: 'student' | 'admin' = email.includes('admin') ? 'admin' : 'student') => setUser({ ...student, email, role }),
    register: (name: string, email: string) => setUser({ ...student, name, email, initials: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), role: 'student' }),
    logout: () => setUser(null),
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
