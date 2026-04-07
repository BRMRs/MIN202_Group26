/**
 * Demo placeholder for detail page integration.
 * To connect real detail page later:
 * - GET /api/discover/resources/{id}
 * - (optional) comments endpoints in /api/comments
 */
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import '../styles/discovery.css';

function ResourceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <div className="d-page">
      <button
        className="d-button d-button-secondary"
        type="button"
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate('/');
          }
        }}
        aria-label="Go back"
        style={{ marginBottom: 10 }}
      >
        ← Back
      </button>
      <div className="d-detail-card">
      <h1 className="d-title">Resource Detail (Demo)</h1>
      <p>Resource ID: {id}</p>
      <p>This placeholder confirms navigation from Home/Search works correctly.</p>
      </div>
    </div>
  );
}
export default ResourceDetailPage;
