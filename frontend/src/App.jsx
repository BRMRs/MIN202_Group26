import { Routes, Route } from 'react-router-dom';
import Navbar from './common/components/Navbar';
import Footer from './common/components/Footer';
import ProtectedRoute from './common/components/ProtectedRoute';

// Module A pages
import { LoginPage, RegisterPage, ProfilePage, ContributorApplyPage, AdminApprovalPage } from './module_a/pages';

// Module E pages
import CategoryManagementPage from './module_e/pages/CategoryManagementPage';
import ResourceManagementPage from './module_e/pages/ResourceManagementPage';
import TagManagementPage from './module_e/pages/TagManagementPage';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* ===== Module A: User & Access Management ===== */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/apply-contributor" element={<ProtectedRoute><ContributorApplyPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><AdminApprovalPage /></ProtectedRoute>} />

        {/* ===== Module B: Resource Submission (TODO) ===== */}
        {/* <Route path="/resources/new" element={<ProtectedRoute roles={['CONTRIBUTOR']}><ResourceFormPage /></ProtectedRoute>} /> */}
        {/* <Route path="/resources/:id/edit" element={<ProtectedRoute roles={['CONTRIBUTOR']}><ResourceFormPage /></ProtectedRoute>} /> */}
        {/* <Route path="/my-resources" element={<ProtectedRoute roles={['CONTRIBUTOR']}><MyResourcesPage /></ProtectedRoute>} /> */}

        {/* ===== Module C: Review & Publication (TODO) ===== */}
        {/* <Route path="/reviews" element={<ProtectedRoute roles={['ADMIN']}><ReviewerDashboardPage /></ProtectedRoute>} /> */}
        {/* <Route path="/reviews/:resourceId" element={<ProtectedRoute roles={['ADMIN']}><ResourceReviewPage /></ProtectedRoute>} /> */}

        {/* ===== Module D: Discovery & Search (TODO) ===== */}
        {/* <Route path="/" element={<HomePage />} /> */}
        {/* <Route path="/search" element={<SearchResultsPage />} /> */}
        {/* <Route path="/resources/:id" element={<ResourceDetailPage />} /> */}

        {/* ===== Module E: System Administration ===== */}
        <Route path="/admin/categories" element={<ProtectedRoute roles={['ADMIN']}><CategoryManagementPage /></ProtectedRoute>} />
        <Route path="/admin/tags" element={<ProtectedRoute roles={['ADMIN']}><TagManagementPage /></ProtectedRoute>} />
        <Route path="/admin/resources" element={<ProtectedRoute roles={['ADMIN']}><ResourceManagementPage /></ProtectedRoute>} />
        {/* <Route path="/admin/dashboard" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboardPage /></ProtectedRoute>} /> */}
        {/* <Route path="/admin/reports" element={<ProtectedRoute roles={['ADMIN']}><ReportPage /></ProtectedRoute>} /> */}

        {/* Fallback */}
        <Route path="*" element={<div style={{ padding: '2rem' }}><h2>Heritage Platform</h2><p>CPT202 Group 26</p></div>} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
