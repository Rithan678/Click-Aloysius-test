import { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getWithAuth } from '../services/apiClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const buildUser = (sessionUser, profile) => {
  if (!sessionUser) return null;

  return {
    id: sessionUser.id,
    email: sessionUser.email,
    name: profile?.name || sessionUser.user_metadata?.full_name || sessionUser.email,
    role: profile?.role || 'student',
    canUpload: Boolean(profile?.canUpload),
    approvedEvents: profile?.approvedEvents || [],
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const hydrateUser = async (session) => {
    if (!session?.user) {
      setUser(null);
      sessionStorage.clear();
      localStorage.clear();
      setLoading(false);
      return;
    }

    try {
      const { data } = await getWithAuth('/auth/me');
      const builtUser = buildUser(session.user, data);
      setUser(builtUser);
      // Store user data in sessionStorage to avoid caching issues
      sessionStorage.setItem('userData', JSON.stringify(builtUser));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load profile from API, falling back to Supabase user');
      const builtUser = buildUser(session.user);
      setUser(builtUser);
      sessionStorage.setItem('userData', JSON.stringify(builtUser));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => hydrateUser(data.session));

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      hydrateUser(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Clear old data
    sessionStorage.removeItem('userData');
    await hydrateUser(data.session);
  };

  const logout = async () => {
    // Clear all stored data immediately
    sessionStorage.clear();
    localStorage.clear();
    
    // Clear user state
    setUser(null);
    setLoading(false);
    
    // Then sign out from Supabase
    await supabase.auth.signOut();
  };

  const refreshUser = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const { data } = await getWithAuth('/auth/me');
        const builtUser = buildUser(sessionData.session.user, data);
        setUser(builtUser);
        sessionStorage.setItem('userData', JSON.stringify(builtUser));
        return builtUser;
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const isStaff = () => user?.role === 'staff' || user?.role === 'admin';
  const isApprovedUploader = () => user?.canUpload === true || isStaff();

  return (
    <AuthContext.Provider value={{ user, login, logout, isStaff, isApprovedUploader, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
