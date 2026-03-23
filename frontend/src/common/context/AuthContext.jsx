import { createContext, useContext, useState } from 'react';

/**
 * Authentication Context — provides user state to all components
 * Module A: Implement full auth state management (Summary A-PBI 1.2, 1.3)
 *
 * TODO (Module A): Store user object, JWT token, and role in state
 * TODO (Module A): Implement login(credentials) — call /api/auth/login, store token
 * TODO (Module A): Implement logout() — call /api/auth/logout, clear token
 * TODO (Module A): Implement register(data) — call /api/auth/register
 * TODO (Module A): Load user from localStorage on app start (persist session)
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  void setUser;
  void setToken;

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    login: () => {},
    logout: () => {},
    register: () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return useContext(AuthContext);
}

export default AuthContext;
