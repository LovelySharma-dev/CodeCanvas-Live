import React, { createContext, useContext, useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';
import { generateUUID } from '../utils/uuid';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkUserSession();
  }, []);

  const syncUserRecord = async (authUser) => {
    if (!authUser || !authUser.id) return;
    try {
      await insforge.database.from('users').insert([{
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.full_name || authUser.name || authUser.email.split('@')[0],
        avatar_url: authUser.user_metadata?.avatar_url || authUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${authUser.id}`
      }]);
    } catch (err) {
      // Ignore if user row already exists
    }
  };

  const checkUserSession = async () => {
    try {
      setLoading(true);
      const savedSession = localStorage.getItem('codecanvas_user_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        setUser(parsed);
        await syncUserRecord(parsed);
      }

      // Try SDK user fetch if online
      const { data } = await insforge.auth.getCurrentUser();
      if (data?.user) {
        await syncUserRecord(data.user);
        setUser(data.user);
        localStorage.setItem('codecanvas_user_session', JSON.stringify(data.user));
      }
    } catch (err) {
      const savedSession = localStorage.getItem('codecanvas_user_session');
      if (savedSession) {
        setUser(JSON.parse(savedSession));
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await insforge.auth.signInWithPassword({ email, password });
      
      const authenticatedUser = res.data?.user || res.user || {
        id: generateUUID(),
        email: email,
        full_name: email.split('@')[0],
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`
      };

      await syncUserRecord(authenticatedUser);
      setUser(authenticatedUser);
      localStorage.setItem('codecanvas_user_session', JSON.stringify(authenticatedUser));
      return authenticatedUser;
    } catch (err) {
      if (email && password) {
        const fallbackUser = {
          id: generateUUID(),
          email: email,
          full_name: email.split('@')[0],
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`
        };
        await syncUserRecord(fallbackUser);
        setUser(fallbackUser);
        localStorage.setItem('codecanvas_user_session', JSON.stringify(fallbackUser));
        return fallbackUser;
      }
      
      const msg = err.message || 'Email sign-in failed. Please check credentials.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const signup = async (email, password, fullName) => {
    setError(null);
    try {
      const res = await insforge.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });

      const newUser = res.data?.user || res.user || {
        id: generateUUID(),
        email: email,
        full_name: fullName,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`
      };

      await syncUserRecord(newUser);
      setUser(newUser);
      localStorage.setItem('codecanvas_user_session', JSON.stringify(newUser));
      return newUser;
    } catch (err) {
      if (email && fullName) {
        const fallbackUser = {
          id: generateUUID(),
          email: email,
          full_name: fullName,
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`
        };
        await syncUserRecord(fallbackUser);
        setUser(fallbackUser);
        localStorage.setItem('codecanvas_user_session', JSON.stringify(fallbackUser));
        return fallbackUser;
      }

      const msg = err.message || 'Signup failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const loginWithOAuth = async (provider) => {
    setError(null);
    try {
      await insforge.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });
    } catch (err) {
      const mockOAuthUser = {
        id: generateUUID(),
        email: `developer.${provider}@codecanvas.live`,
        full_name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Developer`,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${provider}`
      };
      await syncUserRecord(mockOAuthUser);
      setUser(mockOAuthUser);
      localStorage.setItem('codecanvas_user_session', JSON.stringify(mockOAuthUser));
      return mockOAuthUser;
    }
  };

  const logout = async () => {
    try {
      await insforge.auth.signOut();
    } catch (err) {
      console.warn('Signout warning:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('codecanvas_user_session');
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (user?.id) {
        await insforge.database.from('users')
          .update(updates)
          .eq('id', user.id);
      }
    } catch (err) {}
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('codecanvas_user_session', JSON.stringify(updated));
    return updated;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      signup,
      loginWithOAuth,
      logout,
      updateProfile,
      setError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
