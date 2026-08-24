import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, AuthResponse } from '../types';
import { apiLogin, apiRegister, apiGetMe } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  sessionId: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getOrCreateSessionId(): string {
  const existing = localStorage.getItem('fileconv_session_id');
  if (existing) return existing;
  const newId = `sess_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
  localStorage.setItem('fileconv_session_id', newId);
  return newId;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessionId] = useState<string>(getOrCreateSessionId);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('fileconv_token'));
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('fileconv_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (token && !user) {
      apiGetMe(token)
        .then((userData) => {
          setUser(userData);
          localStorage.setItem('fileconv_user', JSON.stringify(userData));
        })
        .catch(() => {
          // Token invalid or expired
          logout();
        });
    }
  }, [token]);

  const saveAuthSession = (authData: AuthResponse) => {
    setToken(authData.access_token);
    setUser(authData.user);
    localStorage.setItem('fileconv_token', authData.access_token);
    localStorage.setItem('fileconv_user', JSON.stringify(authData.user));
    setIsAuthModalOpen(false);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const authData = await apiLogin(email, password);
      saveAuthSession(authData);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const authData = await apiRegister(email, password, name);
      saveAuthSession(authData);
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemo = async () => {
    return login('demo@fileconv.app', 'demo1234');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('fileconv_token');
    localStorage.removeItem('fileconv_user');
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        sessionId,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        loginDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
