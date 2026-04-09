import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  DISCOVER_LOAD_ERROR_MESSAGE,
  listCategories,
  listTags,
  searchAndFilterResources,
} from '../api/discoverApi';
import '../styles/discovery.css';

function HomePage() {
  const [urlParams, setUrlParams] = useSearchParams();

  // Reference data
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  // Results
  const [resources, setResources] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Hero search bar local state (only committed to URL on submit)
  const [heroInput, setHeroInput] = useState('');
  const heroInputRef = useRef(null);

  // Place filter local state (committed on blur / Enter)
  const [placeInput, setPlaceInput] = useState('');

  // Derived filter state from URL
  const filters = useMemo(
    () => ({
      keyword: urlParams.get('keyword') || '',
      categoryId: urlParams.get('categoryId') || '',
      tagIds: urlParams.getAll('tagIds').map(Number).filter(Number.isFinite),
      place: urlParams.get('place') || '',
      sort: urlParams.get('sort') || 'latest',
      page: Number(urlParams.get('page') || 0),
    }),
    [urlParams],
  );

  // Keep hero input in sync when URL keyword changes externally
  useEffect(() => {
    setHeroInput(filters.keyword);
  }, [filters.keyword]);

  // Keep place input in sync with URL
  useEffect(() => {
    setPlaceInput(filters.place);
  }, [filters.place]);

  // Load categories and tags once
  useEffect(() => {
    Promise.all([listCategories(), listTags()])
      .then(([c, t]) => {
        setCategories(c?.data ?? []);
        setTags(t?.data ?? []);
      })
      .catch(() => {});
  }, []);

  // Fetch resources whenever filters change
  const fetchData = async (targetPage) => {
    setLoading(true);
    setLoadError(false);
    try {
      const sortByMap = { liked: 'likeCount', commented: 'commentCount', interaction: 'interaction' };
      const sortBy = sortByMap[filters.sort] || 'createdAt';
      const { data } = await searchAndFilterResources({
        keyword: filters.keyword || undefined,
        categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
        tagIds: filters.tagIds,
        place: filters.place || undefined,
        page: targetPage,
        size: 8,
        sortBy,
        direction: 'DESC',
      });
      setResources(data?.content ?? []);
      setPage(data?.page ?? targetPage);
      setTotalPages(data?.totalPages ?? 0);
    } catch (_e) {
      setResources([]);
      setTotalPages(0);
      setPage(0);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch whenever any filter param changes
  useEffect(() => {
    fetchData(filters.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.keyword, filters.categoryId, filters.place, filters.sort, filters.page, urlParams.getAll('tagIds').join(',')]);

  // Update a single param; resets page to 0 unless explicitly provided
  const updateParam = (key, value) => {
    const next = new URLSearchParams(urlParams);
    next.delete('page');
    if (value === '' || value == null) {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
    setUrlParams(next);
  };

  const updateTagIds = (nextTagIds) => {
    const next = new URLSearchParams(urlParams);
    next.delete('tagIds');
    next.delete('page');
    nextTagIds.forEach((id) => next.append('tagIds', String(id)));
    setUrlParams(next);
  };

  const handleHeroSearch = (e) => {
    e.preventDefault();
    updateParam('keyword', heroInput.trim());
  };

  const toggleTag = (tagId) => {
    const next = filters.tagIds.includes(tagId)
      ? filters.tagIds.filter((id) => id !== tagId)
      : [...filters.tagIds, tagId];
    updateTagIds(next);
  };

  const clearAllFilters = () => {
    setHeroInput('');
    setPlaceInput('');
    setUrlParams(new URLSearchParams());
  };

  const goToPage = (newPage) => {
    const next = new URLSearchParams(urlParams);
    if (newPage > 0) {
      next.set('page', String(newPage));
    } else {
      next.delete('page');
    }
    setUrlParams(next);
  };

  const hasActiveFilters = filters.keyword || filters.categoryId || filters.tagIds.length > 0 || filters.place;

  return (
    <div className="d-browse-page">
      {/* ── Hero ── */}
      <section className="d-hero">
        <div className="d-hero-inner">
          <p className="d-hero-eyebrow">Community Heritage Resource Platform</p>
          <h1 className="d-hero-title">Discover Heritage Resources</h1>
          <p className="d-hero-subtitle">Browse approved cultural and community heritage resources</p>
          <form className="d-hero-search-wrap" onSubmit={handleHeroSearch}>
            <span className="d-hero-search-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              ref={heroInputRef}
              className="d-hero-input"
              type="search"
              value={heroInput}
              onChange={(e) => setHeroInput(e.target.value)}
              placeholder="Search by title, place, or tags..."
              aria-label="Search resources"
            />
            <button className="d-hero-btn" type="submit">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* ── Content ── */}
      <div className="d-browse-content">
        {/* ── Filter bar ── */}
        <div className="d-filter-bar">
          {/* Category */}
          <div className="d-filter-group">
            <span className="d-filter-label">Category</span>
            <select
              className="d-select"
              value={filters.categoryId}
              onChange={(e) => updateParam('categoryId', e.target.value)}
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Place */}
          <div className="d-filter-group">
            <span className="d-filter-label">Place</span>
            <input
              className="d-select"
              type="text"
              value={placeInput}
              onChange={(e) => setPlaceInput(e.target.value)}
              onBlur={() => updateParam('place', placeInput.trim())}
              onKeyDown={(e) => e.key === 'Enter' && updateParam('place', placeInput.trim())}
              placeholder="Any place…"
              aria-label="Filter by place"
            />
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="d-filter-group" style={{ flex: 1 }}>
              <span className="d-filter-label">Tags</span>
              <div className="d-filter-tags-wrap">
                {tags.map((tag) => {
                  const active = filters.tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      className={`d-tag-chip${active ? ' d-tag-chip-active' : ''}`}
                      onClick={() => toggleTag(tag.id)}
                      aria-pressed={active}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sort */}
          <div className="d-filter-group">
            <span className="d-filter-label">Sort By</span>
            <select
              className="d-select"
              value={filters.sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              aria-label="Sort resources"
            >
              <option value="latest">Latest First</option>
              <option value="liked">Most Liked</option>
              <option value="commented">Most Commented</option>
            </select>
          </div>

          {/* Clear all */}
          {hasActiveFilters && (
            <div className="d-filter-group" style={{ justifyContent: 'flex-end' }}>
              <span className="d-filter-label" aria-hidden="true"> </span>
              <button type="button" className="d-clear-btn" onClick={clearAllFilters}>
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* ── Keyword banner ── */}
        {filters.keyword && (
          <div className="d-results-banner">
            <span className="d-results-label">
              Results for: <strong>"{filters.keyword}"</strong>
            </span>
            <button
              type="button"
              className="d-clear-btn"
              onClick={() => {
                setHeroInput('');
                updateParam('keyword', '');
              }}
            >
              Clear search ✕
            </button>
          </div>
        )}

        {/* ── Error ── */}
        {loadError && (
          <div className="d-load-error" role="alert">
            <span>{DISCOVER_LOAD_ERROR_MESSAGE}</span>
            <button className="d-retry" type="button" onClick={() => fetchData(page)}>
              Tap to retry
            </button>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && <p className="d-status">Loading resources…</p>}

        {/* ── Empty state ── */}
        {!loading && !loadError && resources.length === 0 && (
          <div className="d-empty-state">
            <div className="d-empty-panel">
              <div className="d-empty-icon">🏛️</div>
              <p className="d-empty-title">No approved resources found</p>
              <p className="d-empty-sub">Try adjusting your search or filters to discover heritage resources.</p>
              {hasActiveFilters && (
                <div className="d-empty-actions">
                  <button type="button" className="d-empty-action-btn" onClick={clearAllFilters}>
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Resource cards ── */}
        <div className="d-resource-list">
          {resources.map((r) => (
            <article key={r.id} className="d-resource-card">
              {/* Image column */}
              <div className="d-card-image-col">
                <Link to={`/resources/${r.id}`}>
                  {r.fileUrl ? (
                    <img className="d-card-cover" src={r.fileUrl} alt={r.title || 'Resource cover'} />
                  ) : (
                    <div className="d-card-no-image">
                      <span className="d-card-no-image-icon">🏛️</span>
                      <span className="d-card-no-image-label">No image</span>
                    </div>
                  )}
                </Link>
              </div>

              {/* Body column */}
              <div className="d-card-body-col">
                {/* Category + Place badges */}
                {(r.categoryName || r.place) && (
                  <div className="d-card-badges">
                    {r.categoryName && (
                      <span className="d-badge d-badge-category">{r.categoryName}</span>
                    )}
                    {r.place && (
                      <span className="d-badge d-badge-place">📍 {r.place}</span>
                    )}
                  </div>
                )}

                {/* Title */}
                <Link className="d-card-title" to={`/resources/${r.id}`}>
                  {r.title || 'Untitled'}
                </Link>

                {/* Description */}
                {r.description && <p className="d-card-desc">{r.description}</p>}

                {/* Tag chips */}
                {r.tags && r.tags.length > 0 && (
                  <div className="d-card-tags">
                    {r.tags.map((tag) => (
                      <span key={tag.id} className="d-card-tag">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer: stats + view button */}
                <div className="d-card-footer-row">
                  <div className="d-card-stats">
                    <span className="d-stat-item" title="Likes">❤ {r.likeCount ?? 0}</span>
                    <span className="d-stat-item" title="Comments">💬 {r.commentCount ?? 0}</span>
                  </div>
                  <Link className="d-view-link" to={`/resources/${r.id}`}>
                    View Details →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="d-pagination">
            <button
              className="d-page-btn"
              type="button"
              disabled={page <= 0}
              onClick={() => goToPage(page - 1)}
            >
              ← Previous
            </button>
            <span className="d-page-info">
              Page {page + 1} of {totalPages}
            </span>
            <button
              className="d-page-btn"
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
