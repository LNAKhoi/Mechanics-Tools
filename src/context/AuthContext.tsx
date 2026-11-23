import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type AuthContextValue = { isLoggedIn: boolean; signIn: () => void; signOut: () => void };
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const value = useMemo(() => ({ isLoggedIn, signIn: () => setIsLoggedIn(true), signOut: () => setIsLoggedIn(false) }), [isLoggedIn]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
