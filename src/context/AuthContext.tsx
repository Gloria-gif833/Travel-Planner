import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, getMe, type UserInfo } from '../services/authService';

/* ========================================
   Auth Context — 认证状态管理
   ======================================== */

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('auth_token'),
    loading: true,
  });

  // 初始化：如果有 Token 则尝试获取用户信息
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      try {
        const user = await getMe();
        setState({ user, token, loading: false });
      } catch {
        // Token 无效，清除
        localStorage.removeItem('auth_token');
        setState({ user: null, token: null, loading: false });
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    localStorage.setItem('auth_token', result.token);
    setState({
      user: { id: result.id, email: result.email, name: result.name },
      token: result.token,
      loading: false,
    });
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const result = await apiRegister(email, password, name);
    localStorage.setItem('auth_token', result.token);
    setState({
      user: { id: result.id, email: result.email, name: result.name },
      token: result.token,
      loading: false,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setState({ user: null, token: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        isAuthenticated: !!state.user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}