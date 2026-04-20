import { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from '../../module_a/api/authApi';
import { getProfile } from '../../module_a/api/userApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // On app start: if token exists in localStorage, restore the user session
  useEffect(() => {
    if (token) {
      getProfile()
        .then((res) => setUser(res.data.data))
        .catch(() => {
          // Token expired or invalid — clear it
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    const { token: jwt, ...userData } = res.data.data;
    localStorage.setItem('token', jwt);
    setToken(jwt);

    // Fetch full profile with application status
    try {
      const profileRes = await getProfile();
      setUser(profileRes.data.data);
    } catch {
      // Fallback to login response data
      setUser(userData);
    }

    return userData;
  };

  const logout = async () => {
    try {
      await authApi.logoutApi();
    } catch {
      // ignore — still clear local state
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const register = (data) => authApi.register(data);

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return useContext(AuthContext);
}

export default AuthContext;
