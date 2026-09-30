import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiRequest, setTokens, clearTokens, getTokens } from './api';

export interface Profile {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  theme_preference: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, 'full_name' | 'avatar_url' | 'theme_preference'>>) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    const { data, error } = await apiRequest<Profile>('/profile/');
    if (error) {
      console.error('Failed to load profile:', error);
      return;
    }
    if (data) {
      setProfile(data);
      setUser({ id: data.id, username: data.username, email: data.email });
    }
  }

  useEffect(() => {
    const { access } = getTokens();
    if (access) {
      loadProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signUp: AuthContextValue['signUp'] = async (email, password, fullName) => {
    // Django's default User model authenticates by username; we use the
    // email address as the username so sign-in stays email-based.
    const { error } = await apiRequest('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({ username: email, email, password, full_name: fullName }),
    });
    if (error) return { error };

    return signIn(email, password);
  };

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { data, error } = await apiRequest<{ access: string; refresh: string }>('/auth/', {
      method: 'POST',
      body: JSON.stringify({ username: email, password }),
    });
    if (error || !data) return { error: error || 'Login failed' };

    setTokens(data.access, data.refresh);
    await loadProfile();
    return { error: null };
  };

  const signOut: AuthContextValue['signOut'] = async () => {
    clearTokens();
    setUser(null);
    setProfile(null);
  };

  const updateProfile: AuthContextValue['updateProfile'] = async (updates) => {
    if (!user) return { error: 'Not authenticated' };
    const { data, error } = await apiRequest<Profile>('/profile/', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (error) return { error };
    if (data) setProfile(data);
    return { error: null };
  };

  const refreshProfile: AuthContextValue['refreshProfile'] = async () => {
    if (user) await loadProfile();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
