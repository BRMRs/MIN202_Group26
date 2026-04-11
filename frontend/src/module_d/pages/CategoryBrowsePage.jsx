import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  DISCOVER_LOAD_ERROR_MESSAGE,
  listCategories,
  searchAndFilterResources,
} from '../api/discoverApi';
import { TagFilterCombo } from '../components/TagFilterCombo';
import '../styles/discovery.css';

const MAX_FACET_SCAN_PAGES = 20;

/**
 * Browse all resources in ONE category — filters only (tags + place), no global keyword search.
 * Separate route from /search so behaviour stays distinct.
 */
function CategoryBrowsePage() {
  const { categoryId: categoryIdParam } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const categoryId = categoryIdParam != null ? String(categoryIdParam).trim() : '';
  const numericCategoryId = Number.parseInt(categoryId, 10);

  const query = useMemo(
    () => ({
      tagIds: params.getAll('tagIds').map(Number).filter(Number.isFinite),
      place: params.get('place') || '',
      page: Number(params.get('page') || 0),
      sort: params.get('sort') || 'latest',
    }),
    [params],
  );

  const [categoryName, setCategoryName] = useState('');
  const [tags, setTags] = useState([]);
  const [places, setPlaces] = useState([]);
  const [resources, setResources] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [draftTagIds, setDraftTagIds] = useState(query.tagIds);
  const [draftPlace, setDraftPlace] = useState(query.place);
  const [draftSort, setDraftSort] = useState(query.sort);
  const [tagResetSignal, setTagResetSignal] = useState(0);

  useEffect(() => {
    if (!categoryId || !Number.isFinite(numericCategoryId)) return;
    listCategories()
      .then((res) => {
        const list = res?.data ?? [];
        const c = list.find((x) => String(x.id) === String(categoryId));
        setCategoryName(c?.name || 'Category');
      })
      .catch(() => setCategoryName('Category'));
  }, [categoryId, numericCategoryId]);

  useEffect(() => {
    const loadCategoryFacets = async () => {
      if (!Number.isFinite(numericCategoryId)) return;

      const tagMap = new Map();
      const placeSet = new Set();
      let pageIndex = 0;
      let totalPages = 1;

      while (pageIndex < totalPages && pageIndex < MAX_FACET_SCAN_PAGES) {
        const { data } = await searchAndFilterResources({
          categoryId: numericCategoryId,
          page: pageIndex,
          size: 100,
          sortBy: 'createdAt',
          direction: 'DESC',
        });
        const content = data?.content ?? [];

        content.forEach((item) => {
          if (item?.place && item.place.trim()) {
            placeSet.add(item.place.trim());
          }
          (item?.tags ?? []).forEach((tag) => {
            if (tag?.id != null && !tagMap.has(tag.id)) {
              tagMap.set(tag.id, { id: tag.id, name: tag.name });
            }
          });
        });

        totalPages = Number(data?.totalPages ?? 0);
        if (totalPages <= 0) break;
        pageIndex += 1;
      }

      const nextTags = [...tagMap.values()].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      const nextPlaces = [...placeSet].sort((a, b) => a.localeCompare(b));
      setTags(nextTags);
      setPlaces(nextPlaces);
      setDraftTagIds((prev) => prev.filter((id) => tagMap.has(id)));
      setDraftPlace((prev) => (prev && !placeSet.has(prev) ? '' : prev));
    };

    loadCategoryFacets().catch(() => {
      setTags([]);
      setPlaces([]);
    });
  }, [numericCategoryId]);

  useEffect(() => {
    setDraftTagIds(query.tagIds);
    setDraftPlace(query.place);
    setDraftSort(query.sort);
  }, [query.tagIds.join(','), query.place, query.sort]);

  const fetchData = async (pageIndex) => {
    if (!Number.isFinite(numericCategoryId)) return;
    setLoading(true);
    setLoadError(false);
    try {
      const sortBy = query.sort === 'interaction' ? 'interaction' : 'createdAt';
      const { data } = await searchAndFilterResources({
        categoryId: numericCategoryId,
        tagIds: query.tagIds,
        place: query.place || undefined,
        page: pageIndex,
        size: 12,
        sortBy,
        direction: 'DESC',
      });
      setResources(data?.content ?? []);
      setPage(data?.page ?? pageIndex);
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
    if (!Number.isFinite(numericCategoryId)) return;
    fetchData(query.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, query.tagIds.join(','), query.place, query.sort, query.page, params]);

  const syncUrl = ({ tagIds, place, pageNo = 0, sort = 'latest' }) => {
    const next = new URLSearchParams();
    tagIds.forEach((id) => next.append('tagIds', String(id)));
    if (place) next.set('place', place);
    if (sort && sort !== 'latest') next.set('sort', sort);
    if (pageNo > 0) next.set('page', String(pageNo));
    setParams(next);
  };

  const applyFilters = () => {
    syncUrl({ tagIds: draftTagIds, place: draftPlace.trim(), pageNo: 0, sort: draftSort });
  };

  const clearAllFilters = () => {
    setParams(new URLSearchParams());
    setDraftTagIds([]);
    setDraftPlace('');
    setDraftSort('latest');
    setTagResetSignal((n) => n + 1);
  };

  if (!categoryId || !Number.isFinite(numericCategoryId)) {
    return (
      <div className="d-page" style={{ padding: '2rem' }}>
        <p>Invalid category.</p>
        <button type="button" className="d-button" onClick={() => navigate('/')}>
          Home
        </button>
      </div>
    );
  }

  return (
    <div className="d-page d-cat-browse-page">
      <header className="d-cat-browse-header">
        <h1 className="d-title">{categoryName}</h1>
        <p className="d-cat-browse-sub">Filter by tags and place, then Apply.</p>
      </header>

      <section className="d-cat-unified-panel" aria-label="Tag and place filters">
        <div className="d-cat-unified-toolbar">
          <label className="d-cat-unified-field d-cat-unified-grow">
            <span>Place</span>
            <select
              className="d-select"
              value={draftPlace}
              onChange={(e) => setDraftPlace(e.target.value)}
              aria-label="Place"
            >
              <option value="">Any place</option>
              {places.map((pl) => (
                <option key={pl} value={pl}>
                  {pl}
                </option>
              ))}
            </select>
          </label>
          <label className="d-cat-unified-field">
            <span>Sort</span>
            <select
              className="d-select"
              value={draftSort}
              onChange={(e) => setDraftSort(e.target.value)}
              aria-label="Sort"
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
            inputId="cat-browse-tag-input"
            resetSignal={tagResetSignal}
          />
        </div>

        <div className="d-cat-unified-actions">
          <button type="button" className="d-button d-button-quiet" onClick={clearAllFilters}>
            Clear all
          </button>
          <button type="button" className="d-button" onClick={applyFilters}>
            Apply
          </button>
        </div>
      </section>

      <div className="d-explore-divider" role="presentation" />

      {loadError && (
        <div className="d-load-error" role="alert">
          <span>{DISCOVER_LOAD_ERROR_MESSAGE}</span>
          <button className="d-retry" type="button" onClick={() => fetchData(query.page)}>
            Retry
          </button>
        </div>
      )}
      {loading && <p className="d-status">Loading…</p>}
      {!loading && !loadError && resources.length === 0 && (
        <p className="d-empty-hint">No resources match these filters.</p>
      )}

      <div className="d-explore-grid">
        {resources.map((r) => (
          <article key={r.id} className="d-explore-tile">
            <div className="d-explore-tile-img">
              {r.fileUrl ? (
                <img src={r.fileUrl} alt={r.title || ''} />
              ) : (
                <div className="d-explore-tile-ph">No image</div>
              )}
            </div>
            <div className="d-explore-tile-body">
              <h3 className="d-explore-tile-title">
                <Link to={`/resources/${r.id}`}>{r.title || 'Untitled'}</Link>
              </h3>
              {r.place && <p className="d-explore-tile-meta">{r.place}</p>}
            </div>
          </article>
        ))}
      </div>

      {totalPages > 1 && (
        <footer className="d-footer d-explore-footer">
          <button
            type="button"
            className="d-button d-button-secondary"
            disabled={page <= 0}
            onClick={() =>
              syncUrl({
                tagIds: query.tagIds,
                place: query.place,
                pageNo: page - 1,
                sort: query.sort,
              })
            }
          >
            Previous
          </button>
          <span>
            Page {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            className="d-button"
            disabled={page + 1 >= totalPages}
            onClick={() =>
              syncUrl({
                tagIds: query.tagIds,
                place: query.place,
                pageNo: page + 1,
                sort: query.sort,
              })
            }
          >
            Next
          </button>
        </footer>
      )}
    </div>
  );
}

export default CategoryBrowsePage;
