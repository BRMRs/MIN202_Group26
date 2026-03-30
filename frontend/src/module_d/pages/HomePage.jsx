import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { browseResources, DISCOVER_LOAD_ERROR_MESSAGE } from '../api/discoverApi';
import '../styles/discovery.css';

/**
 * Home Page — Module D
 * Summary D-PBI 1: Browse Approved Resources
 */

const VIEWER_DEMO_LOGIN_KEY = 'module_d_viewer_demo_logged_in';

function HomePage() {
  const navigate = useNavigate();
  const [viewerLoggedIn, setViewerLoggedIn] = useState(
    () => window.sessionStorage.getItem(VIEWER_DEMO_LOGIN_KEY) === 'true',
  );
  const [resources, setResources] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortMode, setSortMode] = useState('latest');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const fetchData = async (targetPage) => {
    setLoading(true);
    setLoadError(false);
    try {
      const sortBy = sortMode === 'interaction' ? 'interaction' : 'createdAt';
      const direction = 'DESC';
      const { data } = await browseResources({ page: targetPage, size: 12, sortBy, direction });
      // The API returns ApiResponse<PageResult<ResourceSummaryDto>>
      // So data.data is the PageResult
      const pageData = data?.data || {};
      setResources(pageData.content ?? []);
      setPage(pageData.page ?? targetPage);
      setTotalPages(pageData.totalPages ?? 0);
    } catch (e) {
      setResources([]);
      setTotalPages(0);
      setPage(0);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewerLoggedIn) fetchData(0);
  }, [viewerLoggedIn, sortMode]);

  const handleLoginDemo = () => {
    window.sessionStorage.setItem(VIEWER_DEMO_LOGIN_KEY, 'true');
    setViewerLoggedIn(true);
  };

  const handleLogoutDemo = () => {
    window.sessionStorage.removeItem(VIEWER_DEMO_LOGIN_KEY);
    setViewerLoggedIn(false);
  };

  if (!viewerLoggedIn) {
    return (
      <div className="d-page">
        <div className="d-login-card">
        <h1>Viewer Login (Demo)</h1>
        <p>Temporary test block. Real login will be connected by Module A teammate.</p>
        <button className="d-button" type="button" onClick={handleLoginDemo}>
          Login as Viewer (Demo)
        </button>
        </div>
      </div>
    );
  }

  return (
    <div className="d-page">
      <header className="d-topbar">
        <div>
          <h1 className="d-title">Heritage Platform</h1>
          <p className="d-subtitle">Browse approved resources only</p>
        </div>
        <div className="d-controls">
          <button className="d-button d-button-secondary" type="button" onClick={() => navigate('/search')} aria-label="Search">
            🔍
          </button>
          <button className="d-button d-button-secondary" type="button" onClick={handleLogoutDemo}>
            Logout
          </button>
        </div>
      </header>

      <div className="d-controls">
      <label htmlFor="sort-mode">
        Sort by:{' '}
        <select className="d-select" id="sort-mode" value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
          <option value="latest">Latest First</option>
          <option value="interaction">Most Interactive</option>
        </select>
      </label>
      </div>

      {loadError && (
        <div className="d-load-error" role="alert">
          <span>{DISCOVER_LOAD_ERROR_MESSAGE}</span>
          <button className="d-retry" type="button" onClick={() => fetchData(page)}>
            Tap to retry
          </button>
        </div>
      )}
      {loading && <p className="d-status">Loading...</p>}
      {!loading && !loadError && resources.length === 0 && (
        <p className="d-empty-hint">No resources found.</p>
      )}

      <div className="d-list">
      {resources.map((r) => (
        <article key={r.id} className="d-card">
          <div className="d-card-body">
            <Link to={`/resources/${r.id}`}>
              {r.fileUrl ? (
                <img className="d-thumb" src={r.fileUrl} alt={r.title || 'resource'} />
              ) : (
                <div className="d-thumb-placeholder">No Image</div>
              )}
            </Link>
            <div>
              <h3 style={{ marginTop: 0 }}>
                <Link className="d-link" to={`/resources/${r.id}`}>{r.title || 'Untitled'}</Link>
              </h3>
              <p>{r.description || 'Not provided'}</p>
              <p>Category: {r.categoryName || 'Not provided'}</p>
              <div className="d-meta-row">
                <span className="d-meta-item" title="Like count">❤ {r.likeCount ?? 0}</span>
                <span className="d-meta-item" title="Comment count">💬 {r.commentCount ?? 0}</span>
              </div>
            </div>
          </div>
        </article>
      ))}
      </div>

      {totalPages > 0 && (
        <footer className="d-footer">
          <button className="d-button d-button-secondary" type="button" disabled={page <= 0} onClick={() => fetchData(page - 1)}>
            Previous Page
          </button>
          <span>
            Page {page + 1} / {totalPages}
          </span>
          <button className="d-button" type="button" disabled={page + 1 >= totalPages} onClick={() => fetchData(page + 1)}>
            Next Page
          </button>
        </footer>
      )}
    </div>
  );
}

export default HomePage;
