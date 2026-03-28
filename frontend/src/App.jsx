import { Routes, Route } from 'react-router-dom';
import ReviewerDashboardPage from './module_c/pages/ReviewerDashboardPage';
import ResourceReviewPage from './module_c/pages/ResourceReviewPage';

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
      {/* TODO: <Route path="/profile" element={<ProfilePage />} /> */}
      {/* TODO: <Route path="/apply-contributor" element={<ContributorApplyPage />} /> */}
      {/* TODO: <Route path="/admin/users" element={<AdminApprovalPage />} /> */}

      {/* ===== Module B: Resource Submission ===== */}
      {/* TODO: <Route path="/resources/new" element={<ResourceFormPage />} /> */}
      {/* TODO: <Route path="/resources/:id/edit" element={<ResourceFormPage />} /> */}
      {/* TODO: <Route path="/my-resources" element={<MyResourcesPage />} /> */}

      {/* ===== Module C: Review & Publication ===== */}
      <Route path="/reviews" element={<ReviewerDashboardPage />} />
      <Route path="/reviews/:resourceId" element={<ResourceReviewPage />} />

      {/* ===== Module D: Discovery & Search ===== */}
      {/* TODO: <Route path="/" element={<HomePage />} /> */}
      {/* TODO: <Route path="/search" element={<SearchResultsPage />} /> */}
      {/* TODO: <Route path="/resources/:id" element={<ResourceDetailPage />} /> */}

      {/* ===== Module E: System Administration ===== */}
      {/* TODO: <Route path="/admin/categories" element={<CategoryManagementPage />} /> */}
      {/* TODO: <Route path="/admin/tags" element={<TagManagementPage />} /> */}
      {/* TODO: <Route path="/admin/dashboard" element={<AdminDashboardPage />} /> */}
      {/* TODO: <Route path="/admin/reports" element={<ReportPage />} /> */}

      {/* Fallback / temp home → redirect to reviews for testing */}
      <Route path="/" element={<ReviewerDashboardPage />} />
      <Route path="*" element={<div style={{padding:32}}><h1>Heritage Platform</h1><p>CPT202 Group 26 — Page not found</p></div>} />
    </Routes>
  );
}

export default App;
