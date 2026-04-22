import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  DISCOVER_LOAD_ERROR_MESSAGE,
  listCategories,
  listPlaces,
  listTags,
  searchAndFilterResources,
} from '../api/discoverApi';
import { TagFilterCombo } from '../components/TagFilterCombo';
import { DEFAULT_RESOURCE_COVER, thumbnailSrcOrDefault } from '../utils/defaultResourceCover';
import '../styles/discovery.css';

/**
 * Global search page — simplified layout:
 * one-line search hint + unified filters (category + place + tags + sort).
 */
function SearchResultsPage() {
  const [, setParams] = useSearchParams();
  const { search } = useLocation();

  const query = useMemo(() => {
    const p = new URLSearchParams(search);
    return {
      keyword: p.get('keyword') || '',
      categoryId: p.get('categoryId') || '',
      tagIds: p.getAll('tagIds').map(Number).filter(Number.isFinite),
      place: p.get('place') || '',
      page: Number(p.get('page') || 0),
      sort: p.get('sort') || 'latest',
    };
  }, [search]);

  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [places, setPlaces] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [keywordInput, setKeywordInput] = useState(query.keyword);
  const [draftCategoryId, setDraftCategoryId] = useState(query.categoryId);
  const [draftTagIds, setDraftTagIds] = useState(query.tagIds);
  const [draftPlace, setDraftPlace] = useState(query.place);
  const [draftSort, setDraftSort] = useState(query.sort);
  const [tagResetSignal, setTagResetSignal] = useState(0);

  const sync = ({ keyword, categoryId, tagIds, place, pageNo = 0, sort = query.sort }) => {
    const next = new URLSearchParams();
    if (keyword) next.set('keyword', keyword);
    if (categoryId) next.set('categoryId', String(categoryId));
    tagIds.forEach((id) => next.append('tagIds', String(id)));
    if (place) next.set('place', place);
    if (sort && sort !== 'latest') next.set('sort', sort);
    if (pageNo > 0) next.set('page', String(pageNo));
    setParams(next);
  };

  useEffect(() => {
    Promise.all([listCategories(), listTags(), listPlaces()])
      .then(([c, t, p]) => {
        setCategories(c?.data ?? []);
        setTags(t?.data ?? []);
        setPlaces(Array.isArray(p?.data) ? p.data : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setKeywordInput(query.keyword);
    setDraftCategoryId(query.categoryId);
    setDraftTagIds(query.tagIds);
    setDraftPlace(query.place);
    setDraftSort(query.sort);
  }, [query.keyword, query.categoryId, query.sort, query.place, query.tagIds.join(',')]);

  const fetchData = async (p) => {
    setLoading(true);
    setLoadError(false);
    try {
      const sortBy = query.sort === 'interaction' ? 'interaction' : 'createdAt';
      const { data } = await searchAndFilterResources({
        keyword: query.keyword || undefined,
        categoryId: query.categoryId ? Number(query.categoryId) : undefined,
        tagIds: query.tagIds,
        place: query.place || undefined,
        page: p,
        size: 10,
        sortBy,
        direction: 'DESC',
      });
      setResources(data?.content ?? []);
      setPage(data?.page ?? p);
      setTotalPages(data?.totalPages ?? 0);
    } catch (_e) {
      setResources([]);
      setTotalPages(0);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(query.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.keyword, query.categoryId, query.sort, query.page, query.place, query.tagIds.join(','), search]);

  const applyFilters = () => {
    sync({
      keyword: keywordInput.trim(),
      categoryId: draftCategoryId,
      tagIds: draftTagIds,
      place: draftPlace.trim(),
      pageNo: 0,
      sort: draftSort,
    });
  };

  const submitSearch = (e) => {
    e.preventDefault();
    applyFilters();
  };

  return (
    <div className="d-page">
      <p className="d-search-brief">Type keywords and refine with filters below.</p>

      <div className="d-controls">
        <form className="d-search-form" onSubmit={submitSearch}>
          <div className="d-search-box">
            <input
              className="d-input"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Search titles, tags, or places…"
              aria-label="Search keywords"
              autoComplete="off"
            />
          </div>
          <button className="d-button" type="submit">
            Search
          </button>
        </form>
      </div>

      <section className="d-cat-unified-panel d-search-minimal-panel" aria-label="Search filters">
        <div className="d-cat-unified-toolbar d-search-filters-toolbar">
          <label className="d-cat-unified-field d-cat-unified-grow" htmlFor="search-filter-cat">
            <span>Category</span>
            <select
              className="d-select"
              id="search-filter-cat"
              value={draftCategoryId}
              onChange={(e) => setDraftCategoryId(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="d-cat-unified-field d-cat-unified-grow" htmlFor="search-filter-place">
            <span>Place</span>
            <select
              className="d-select"
              id="search-filter-place"
              value={draftPlace}
              onChange={(e) => setDraftPlace(e.target.value)}
            >
              <option value="">Any place</option>
              {places.map((pl) => (
                <option key={pl} value={pl}>
                  {pl}
                </option>
              ))}
            </select>
          </label>
          <label className="d-cat-unified-field" htmlFor="search-filter-sort">
            <span>Sort</span>
            <select
              className="d-select"
              id="search-filter-sort"
              value={draftSort}
              onChange={(e) => setDraftSort(e.target.value)}
            >
              <option value="latest">Latest first</option>
              <option value="interaction">Most interactive</option>
            </select>
          </label>
        </div>
        <div className="d-cat-unified-tag-block">
          <span className="d-cat-unified-tag-label">Tags</span>
          <TagFilterCombo
            tags={tags}
            selectedIds={draftTagIds}
            onSelectedIdsChange={setDraftTagIds}
            inputId="search-tag-input"
            resetSignal={tagResetSignal}
          />
        </div>
        <div className="d-cat-unified-actions">
          <button
            type="button"
            className="d-button d-button-quiet"
            onClick={() => {
              setDraftCategoryId('');
              setDraftTagIds([]);
              setDraftPlace('');
              setDraftSort('latest');
              setTagResetSignal((n) => n + 1);
            }}
          >
            Clear all
          </button>
          <button type="button" className="d-button" onClick={applyFilters}>
            Apply
          </button>
        </div>
      </section>

      {loadError && (
        <div className="d-load-error" role="alert">
          <span>{DISCOVER_LOAD_ERROR_MESSAGE}</span>
          <button className="d-retry" type="button" onClick={() => fetchData(query.page)}>
            Tap to retry
          </button>
        </div>
      )}
      {loading && <p className="d-status">Loading...</p>}
      {!loading && !loadError && resources.length === 0 && <p className="d-empty-hint">No resources found.</p>}

      <div className="d-list">
        {resources.map((r) => (
          <article key={r.id} className="d-card">
            <div className="d-card-body">
              <div className="d-thumb-wrap">
                <img
                  className="d-thumb"
                  src={thumbnailSrcOrDefault(r.fileUrl)}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_RESOURCE_COVER;
                  }}
                />
              </div>
              <div>
                <h3 style={{ marginTop: 0 }}>
                  <Link className="d-link" to={`/resources/${r.id}`}>
                    {r.title || 'Untitled'}
                  </Link>
                </h3>
                <p>{r.description || 'Not provided'}</p>
                <p>
                  Category: {r.categoryName || 'Not provided'}
                  {r.place && ` · ${r.place}`}
                </p>
                <div className="d-meta-row">
                  <span className="d-meta-item" title="Like count">
                    ❤ {r.likeCount ?? 0}
                  </span>
                  <span className="d-meta-item" title="Comment count">
                    💬 {r.commentCount ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {totalPages > 1 && (
        <footer className="d-footer">
          <button
            type="button"
            className="d-button d-button-secondary"
            disabled={page <= 0}
            onClick={() =>
              sync({
                keyword: query.keyword,
                categoryId: query.categoryId,
                tagIds: query.tagIds,
                place: query.place,
                pageNo: page - 1,
                sort: query.sort,
              })
            }
          >
            Previous Page
          </button>
          <span>
            Page {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            className="d-button"
            disabled={page + 1 >= totalPages}
            onClick={() =>
              sync({
                keyword: query.keyword,
                categoryId: query.categoryId,
                tagIds: query.tagIds,
                place: query.place,
                pageNo: page + 1,
                sort: query.sort,
              })
            }
          >
            Next Page
          </button>
        </footer>
      )}
    </div>
  );
}

export default SearchResultsPage;
