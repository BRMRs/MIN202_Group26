import { Routes, Route, Navigate } from 'react-router-dom'
import ResourceSubmissionPage from './module_b/pages/ResourceSubmissionPage'
import DraftBoxPage from './module_b/pages/DraftBoxPage'
import AdminReviewPage from './module_b/pages/AdminReviewPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/module-b/submit" replace />} />
      <Route path="/module-b/submit" element={<ResourceSubmissionPage />} />
      <Route path="/module-b/drafts" element={<DraftBoxPage />} />
      <Route path="/module-b/review" element={<AdminReviewPage />} />
    </Routes>
  )
}
