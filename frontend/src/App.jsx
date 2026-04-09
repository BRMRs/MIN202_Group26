import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './common/components/Navbar';
import Footer from './common/components/Footer';
import ProtectedRoute from './common/components/ProtectedRoute';

import { LoginPage, RegisterPage, ProfilePage, ContributorApplyPage, AdminApprovalPage } from './module_a/pages';
import { ResourceSubmissionPage, DraftBoxPage } from './module_b/pages';
import ReviewerDashboardPage from './module_c/pages/ReviewerDashboardPage';
import ResourceReviewPage from './module_c/pages/ResourceReviewPage';
import { HomePage, ResourceDetailPage, SearchResultsPage } from './module_d/pages';
import CategoryManagementPage from './module_e/pages/CategoryManagementPage';
import ResourceManagementPage from './module_e/pages/ResourceManagementPage';
import TagManagementPage from './module_e/pages/TagManagementPage';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/resources/:id" element={<ResourceDetailPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/apply-contributor" element={<ProtectedRoute><ContributorApplyPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><AdminApprovalPage /></ProtectedRoute>} />

        <Route path="/module-b/submit" element={<ProtectedRoute roles={['CONTRIBUTOR']}><ResourceSubmissionPage /></ProtectedRoute>} />
        <Route path="/module-b/drafts" element={<ProtectedRoute roles={['CONTRIBUTOR']}><DraftBoxPage /></ProtectedRoute>} />
        <Route path="/module-b/review" element={<ProtectedRoute roles={['ADMIN']}><Navigate to="/reviews" replace /></ProtectedRoute>} />

        <Route path="/reviews" element={<ProtectedRoute roles={['ADMIN']}><ReviewerDashboardPage /></ProtectedRoute>} />
        <Route path="/reviews/:resourceId" element={<ProtectedRoute roles={['ADMIN']}><ResourceReviewPage /></ProtectedRoute>} />

        <Route path="/admin/categories" element={<ProtectedRoute roles={['ADMIN']}><CategoryManagementPage /></ProtectedRoute>} />
        <Route path="/admin/tags" element={<ProtectedRoute roles={['ADMIN']}><TagManagementPage /></ProtectedRoute>} />
        <Route path="/admin/resources" element={<ProtectedRoute roles={['ADMIN']}><ResourceManagementPage /></ProtectedRoute>} />

        <Route path="*" element={<div style={{ padding: '2rem' }}><h2>Heritage Platform</h2><p>CPT202 Group 26</p></div>} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
