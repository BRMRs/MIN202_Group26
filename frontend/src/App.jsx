import { Routes, Route } from 'react-router-dom';
import { HomePage, SearchResultsPage, ResourceDetailPage } from './module_d/pages';

/**
 * App Router — Heritage Platform
 * CPT202 Group 26
 *
 * Route ownership by module:
 * - Module A: /login, /register, /profile, /apply-contributor, /admin/users
 * - Module B: /resources/new, /resources/:id/edit, /my-resources
 * - Module C: /reviews, /reviews/:resourceId
 * - Module D: /, /search, /resources/:id
 * - Module E: /admin/categories, /admin/tags, /admin/dashboard, /admin/reports
 *
 * To add a route: import your page component and add a <Route> below.
 * Use <ProtectedRoute> from common/components for authenticated routes.
 */
function App() {
  return (
    <Routes>
      {/* ===== Module A: User & Access Management ===== */}
      {/* TODO: import LoginPage from './module_a/pages/LoginPage' */}
      {/* TODO: <Route path="/login" element={<LoginPage />} /> */}
      {/* TODO: <Route path="/register" element={<RegisterPage />} /> */}
      {/* TODO: <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} /> */}
      {/* TODO: <Route path="/apply-contributor" element={<ProtectedRoute><ContributorApplyPage /></ProtectedRoute>} /> */}
      {/* TODO: <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><AdminApprovalPage /></ProtectedRoute>} /> */}

      {/* ===== Module B: Resource Submission ===== */}
      {/* TODO: <Route path="/resources/new" element={<ProtectedRoute roles={['CONTRIBUTOR']}><ResourceFormPage /></ProtectedRoute>} /> */}
      {/* TODO: <Route path="/resources/:id/edit" element={<ProtectedRoute roles={['CONTRIBUTOR']}><ResourceFormPage /></ProtectedRoute>} /> */}
      {/* TODO: <Route path="/my-resources" element={<ProtectedRoute roles={['CONTRIBUTOR']}><MyResourcesPage /></ProtectedRoute>} /> */}

      {/* ===== Module C: Review & Publication ===== */}
      {/* TODO: <Route path="/reviews" element={<ProtectedRoute roles={['ADMIN']}><ReviewerDashboardPage /></ProtectedRoute>} /> */}
      {/* TODO: <Route path="/reviews/:resourceId" element={<ProtectedRoute roles={['ADMIN']}><ResourceReviewPage /></ProtectedRoute>} /> */}

      {/* ===== Module D: Discovery & Search ===== */}
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchResultsPage />} />
      <Route path="/resources/:id" element={<ResourceDetailPage />} />
      
      {/* 为了方便测试，让 /resource/:id 也指向详情页 */}
      <Route path="/resource/:id" element={<ResourceDetailPage />} />

      {/* ===== Module E: System Administration ===== */}
      {/* TODO: <Route path="/admin/categories" element={<ProtectedRoute roles={['ADMIN']}><CategoryManagementPage /></ProtectedRoute>} /> */}
      {/* TODO: <Route path="/admin/tags" element={<ProtectedRoute roles={['ADMIN']}><TagManagementPage /></ProtectedRoute>} /> */}
      {/* TODO: <Route path="/admin/dashboard" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboardPage /></ProtectedRoute>} /> */}
      {/* TODO: <Route path="/admin/reports" element={<ProtectedRoute roles={['ADMIN']}><ReportPage /></ProtectedRoute>} /> */}

      {/* Fallback */}
      <Route path="*" element={<div><h1>Heritage Platform</h1><p>CPT202 Group 26 — Page not found</p><button onClick={() => window.location.href='/'}>Go Home</button></div>} />
    </Routes>
  );
}

export default App;
