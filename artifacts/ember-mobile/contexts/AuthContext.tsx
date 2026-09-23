import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  clearSessionCookie,
  forgotPassword,
  getSession,
  hydrateSessionCookie,
  login,
  logout,
  register,
} from '@/lib/api';
import type { User } from '@/lib/types';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await hydrateSessionCookie();
        const session = await getSession();
        if (active) setUser(session.user);
      } catch {
        await clearSessionCookie();
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const result = await login(email, password);
      setUser(result.user);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No se pudo iniciar sesión';
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const result = await register(email, password);
      setUser(result.user);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No se pudo crear la cuenta';
    }
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await forgotPassword(email);
      return null;
    } catch (error) {
      return error instanceof Error
        ? error.message
        : 'No se pudo procesar la solicitud';
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut, resetPassword }),
    [loading, resetPassword, signIn, signOut, signUp, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}