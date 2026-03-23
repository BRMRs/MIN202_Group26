/**
 * Protected Route Component — wraps routes that require authentication
 * TODO (Module A): Check if user is authenticated (useAuth hook)
 * TODO (Module A): Redirect to /login if not authenticated
 * TODO (Module A): Check user role if roles prop is provided
 * TODO (Module A): Redirect to / if user doesn't have required role
 *
 * Usage:
 * <ProtectedRoute><ProfilePage /></ProtectedRoute>
 * <ProtectedRoute roles={['ADMIN']}><AdminPage /></ProtectedRoute>
 */
function ProtectedRoute({ children, roles }) {
  void roles;
  return children;
}

export default ProtectedRoute;
