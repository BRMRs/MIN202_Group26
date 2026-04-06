import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  DISCOVER_LOAD_ERROR_MESSAGE,
  listCategories,
  listTags,
  searchAndFilterResources,
} from '../api/discoverApi';
import '../styles/discovery.css';

const VIEWER_DEMO_LOGIN_KEY = 'module_d_viewer_demo_logged_in';

function SearchResultsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [keywordInput, setKeywordInput] = useState(params.get('keyword') || '');
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftCategoryId, setDraftCategoryId] = useState(params.get('categoryId') || '');
  const [draftTagIds, setDraftTagIds] = useState(params.getAll('tagIds').map(Number).filter(Number.isFinite));
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [sortMode, setSortMode] = useState(params.get('sort') || 'latest');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const query = useMemo(
    () => ({
      keyword: params.get('keyword') || '',
      categoryId: params.get('categoryId') || '',
      tagIds: params.getAll('tagIds').map(Number).filter(Number.isFinite),
      page: Number(params.get('page') || 0),
      sort: params.get('sort') || 'latest',
    }),
    [params],
  );

  const sync = ({ keyword, categoryId, tagIds, pageNo = 0, sort = query.sort }) => {
    const next = new URLSearchParams();
    if (keyword) next.set('keyword', keyword);
    if (categoryId) next.set('categoryId', String(categoryId));
    tagIds.forEach((id) => next.append('tagIds', String(id)));
    if (sort) next.set('sort', sort);
    if (pageNo > 0) next.set('page', String(pageNo));
    setParams(next);
  };

  const fetchData = async (p) => {
    setLoading(true);
    setLoadError(false);
    try {
      const sortBy = query.sort === 'interaction' ? 'interaction' : 'createdAt';
      const { data } = await searchAndFilterResources({
        keyword: query.keyword || undefined,
        categoryId: query.categoryId ? Number(query.categoryId) : undefined,
        tagIds: query.tagIds,
        page: p,
        size: 5,
        sortBy,
        direction: 'DESC',
      });
      setResources(data?.content ?? []);
      setPage(data?.page ?? p);
      setTotalPages(data?.totalPages ?? 0);
    } catch (e) {
      setResources([]);
      setTotalPages(0);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.sessionStorage.getItem(VIEWER_DEMO_LOGIN_KEY) !== 'true') {
      navigate('/');
      return;
    }
    Promise.all([listCategories(), listTags()]).then(([c, t]) => {
      setCategories(c?.data ?? []);
      setTags(t?.data ?? []);
    });
  }, [navigate]);

  useEffect(() => {
    setKeywordInput(query.keyword);
    setDraftCategoryId(query.categoryId);
    setDraftTagIds(query.tagIds);
    setSortMode(query.sort);
    fetchData(query.page);
  }, [query.keyword, query.categoryId, query.sort, params]);

  const applyFilters = () => {
    sync({ keyword: query.keyword, categoryId: draftCategoryId, tagIds: draftTagIds, pageNo: 0, sort: sortMode });
    setFilterOpen(false);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const kw = keywordInput.trim();
    setShowSuggestions(false);
    sync({ keyword: kw, categoryId: query.categoryId, tagIds: query.tagIds, pageNo: 0, sort: sortMode });
  };

  useEffect(() => {
    const keyword = keywordInput.trim();
    if (!keyword) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const { data } = await searchAndFilterResources({
          keyword,
          page: 0,
          size: 30,
          sortBy: 'createdAt',
          direction: 'DESC',
        });
        const content = data?.content ?? [];
        const uniqueTitles = [...new Set(content.map((item) => item.title).filter(Boolean))];
        setSuggestions(uniqueTitles);
      } catch (_e) {
        setSuggestions([]);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [keywordInput]);

  return (
    <div className="d-page">
      <header className="d-topbar">
        <h1 className="d-title">Search Resources</h1>
        <button className="d-button d-button-secondary" type="button" onClick={() => navigate('/')}>
          🏠
        </button>
      </header>

      <div className="d-controls">
        <form className="d-search-form" onSubmit={submitSearch}>
          <div className="d-search-box">
            <input
              className="d-input"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search title or description"
              aria-label="Search keywords"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div
                className="d-suggest-box"
                onWheel={(event) => {
                  event.stopPropagation();
                }}
              >
                {suggestions.map((title) => (
                  <button
                    key={title}
                    className="d-suggest-item"
                    type="button"
                    onClick={() => {
                      setKeywordInput(title);
                      setShowSuggestions(false);
                      sync({ keyword: title, categoryId: query.categoryId, tagIds: query.tagIds, pageNo: 0, sort: sortMode });
                    }}
                  >
                    {title}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="d-button" type="submit" aria-label="Search">
            🔍
          </button>
        </form>
        <button className="d-button d-button-secondary" type="button" onClick={() => setFilterOpen((v) => !v)}>
          ⚙
        </button>
        <select
          className="d-select"
          value={sortMode}
          onChange={(e) => {
            const nextSort = e.target.value;
            setSortMode(nextSort);
            sync({ keyword: query.keyword, categoryId: query.categoryId, tagIds: query.tagIds, pageNo: 0, sort: nextSort });
          }}
        >
          <option value="latest">Latest First</option>
          <option value="interaction">Most Interactive</option>
        </select>
      </div>

      {filterOpen && (
        <section className="d-panel">
          <h3>Filters</h3>
          <div>
            <label htmlFor="cat">Category: </label>
            <select className="d-select" id="cat" value={draftCategoryId} onChange={(e) => setDraftCategoryId(e.target.value)}>
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="d-tags">
            {tags.map((tag) => (
              <label key={tag.id} style={{ marginRight: 10 }}>
                <input
                  type="checkbox"
                  checked={draftTagIds.includes(tag.id)}
                  onChange={() =>
                    setDraftTagIds((prev) =>
                      prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id],
                    )
                  }
                />{' '}
                {tag.name}
              </label>
            ))}
          </div>
          <div className="d-controls">
            <button className="d-button d-button-secondary" type="button" onClick={() => { setDraftCategoryId(''); setDraftTagIds([]); }}>
              Clear All
            </button>
            <button className="d-button" type="button" onClick={applyFilters}>
              Apply
            </button>
          </div>
        </section>
      )}

      {loadError && (
        <div className="d-load-error" role="alert">
          <span>{DISCOVER_LOAD_ERROR_MESSAGE}</span>
          <button className="d-retry" type="button" onClick={() => fetchData(query.page)}>
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
          <button className="d-button d-button-secondary" type="button" disabled={page <= 0} onClick={() => sync({ keyword: query.keyword, categoryId: query.categoryId, tagIds: query.tagIds, pageNo: page - 1, sort: sortMode })}>
            Previous Page
          </button>
          <span>
            Page {page + 1} / {totalPages}
          </span>
          <button className="d-button" type="button" disabled={page + 1 >= totalPages} onClick={() => sync({ keyword: query.keyword, categoryId: query.categoryId, tagIds: query.tagIds, pageNo: page + 1, sort: sortMode })}>
            Next Page
          </button>
        </footer>
      )}
    </div>
  );
}

export default SearchResultsPage;
