import { Routes, Route } from 'react-router-dom';
import { ResourceSubmissionPage, DraftBoxPage, AdminReviewPage } from './module_b/pages';

/**
 * App Router — Heritage Platform
 * CPT202 Group 26
 *
 * Route ownership by module:
 * - Module A: /login, /register, /profile, /apply-contributor, /admin/users
 * - Module B: /module-b/submit, /module-b/drafts, /module-b/review
 * - Module C: /reviews, /reviews/:resourceId
 * - Module D: /, /search, /resources/:id
 * - Module E: /admin/categories, /admin/tags, /admin/dashboard, /admin/reports
 */
function App() {
  return (
    <Routes>
      <Route path="/module-b/submit" element={<ResourceSubmissionPage />} />
      <Route path="/module-b/drafts" element={<DraftBoxPage />} />
      <Route path="/module-b/review" element={<AdminReviewPage />} />

      {/* Fallback */}
      <Route path="*" element={<div><h1>Heritage Platform</h1><p>CPT202 Group 26 — Page not found</p></div>} />
    </Routes>
  );
}

export default App;