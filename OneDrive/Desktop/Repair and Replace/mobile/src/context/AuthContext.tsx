import React, { createContext, useContext, useEffect, useState } from 'react';
import { MobileApi, getAuthToken, setAuthToken } from '../api/client';
import { Role, User } from '../api/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isInitializing: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  switchRole: (role: Role) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const storedToken = await getAuthToken();
      if (storedToken) {
        setTokenState(storedToken);
        const res = await MobileApi.getCurrentUser();
        if (res.success && res.data) {
          setUser(res.data);
        } else {
          await setAuthToken(null);
          setTokenState(null);
        }
      }
    } catch (err) {
      console.warn('Failed to load authenticated user session:', err);
      // Clean stale token if invalid
      await setAuthToken(null);
      setTokenState(null);
    } finally {
      setIsInitializing(false);
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await MobileApi.login(credentials);
      if (res.success && res.data) {
        await setAuthToken(res.data.token);
        setTokenState(res.data.token);
        setUser(res.data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (role: Role) => {
    setIsLoading(true);
    try {
      const res = await MobileApi.switchRole(role);
      if (res.success && res.data) {
        await setAuthToken(res.data.token);
        setTokenState(res.data.token);
        setUser(res.data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await MobileApi.logout();
    } catch (err) {
      // ignore network errors on logout
    }
    await setAuthToken(null);
    setTokenState(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await MobileApi.getCurrentUser();
      if (res.success && res.data) {
        setUser(res.data);
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isInitializing,
        isLoading,
        login,
        switchRole,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
