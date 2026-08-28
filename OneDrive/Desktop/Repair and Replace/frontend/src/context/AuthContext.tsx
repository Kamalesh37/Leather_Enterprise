import React, { createContext, useContext, useEffect, useState } from 'react';
import { Api, getAuthToken, setAuthToken } from '../api/client';
import { Role, User, UserPermission } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: Role) => Promise<void>;
  hasRole: (roles: Role | Role[]) => boolean;
  hasPermission: (permissionKey: keyof Omit<UserPermission, 'id' | 'user_id'>) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (token) {
        const res = await Api.getCurrentUser();
        if (res.success && res.data) {
          setUser(res.data);
          return;
        }
      }

      // Default demo login as Admin if no active session
      const switchRes = await Api.switchRole('admin');
      if (switchRes.success && switchRes.data) {
        setAuthToken(switchRes.data.token);
        setUser(switchRes.data.user);
      }
    } catch (err) {
      console.warn('Auth initialization fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await Api.login({ email, password });
      if (res.success && res.data) {
        setAuthToken(res.data.token);
        setUser(res.data.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await Api.logout();
    } catch (e) {
      // ignore
    }
    setAuthToken(null);
    setUser(null);
  };

  const switchDemoRole = async (role: Role) => {
    setLoading(true);
    try {
      const res = await Api.switchRole(role);
      if (res.success && res.data) {
        setAuthToken(res.data.token);
        setUser(res.data.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (roles: Role | Role[]): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const hasPermission = (permissionKey: keyof Omit<UserPermission, 'id' | 'user_id'>): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return Boolean(user.permission?.[permissionKey]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        switchDemoRole,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
