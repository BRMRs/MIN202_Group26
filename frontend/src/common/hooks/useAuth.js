/**
 * useAuth Hook — access authentication state in any component
 * Module A: Implement using AuthContext (Summary A-PBI 1.2, 1.3, 1.4)
 *
 * TODO (Module A): Connect to AuthContext
 * TODO (Module A): Return { user, token, isAuthenticated, login, logout, register }
 *
 * Usage:
 * const { user, isAuthenticated, login, logout } = useAuth();
 */
function useAuth() {
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    login: () => {},
    logout: () => {},
    register: () => {},
  };
}

export default useAuth;
