import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DISCOVER_LOAD_ERROR_MESSAGE, listCategories, searchAndFilterResources } from '../api/discoverApi';
import { DEFAULT_RESOURCE_COVER, thumbnailSrcOrDefault } from '../utils/defaultResourceCover';
import '../styles/discovery.css';

const PREVIEW_SIZE = 4;

function HomePage() {
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState('');
  const [heroSuggestOpen, setHeroSuggestOpen] = useState(false);
  const [heroTitleHits, setHeroTitleHits] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const onHeroSubmit = (e) => {
    e.preventDefault();
    const q = heroQuery.trim();
    navigate(q ? `/search?keyword=${encodeURIComponent(q)}` : '/search');
  };

  useEffect(() => {
    const kw = heroQuery.trim();
    if (!kw) {
      setHeroTitleHits([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const { data } = await searchAndFilterResources({
          keyword: kw,
          page: 0,
          size: 8,
          sortBy: 'createdAt',
          direction: 'DESC',
        });
        const titleHits = (data?.content ?? [])
          .filter((item) => item?.id && item?.title)
          .map((item) => ({ id: item.id, title: item.title, place: item.place || '' }));
        setHeroTitleHits(titleHits);
      } catch {
        setHeroTitleHits([]);
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [heroQuery]);

  const pickHeroTitle = (hit) => {
    setHeroSuggestOpen(false);
    navigate(`/resources/${hit.id}`);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const { data: cats } = await listCategories();
        const list = Array.isArray(cats) ? cats : [];
        const visibleCategories = list.filter(
          (cat) => cat?.id != null && cat?.name && (cat?.status ? cat.status === 'ACTIVE' : true),
        );
        if (cancelled) return;
        const rows = await Promise.all(
          visibleCategories.map(async (cat) => {
            try {
              const { data } = await searchAndFilterResources({
                categoryId: cat.id,
                page: 0,
                size: PREVIEW_SIZE,
                sortBy: 'createdAt',
                direction: 'DESC',
              });
              return { category: cat, resources: data?.content ?? [] };
            } catch {
              return { category: cat, resources: [] };
            }
          }),
        );
        if (!cancelled) setSections(rows);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="d-browse-page">
      <section className="d-hero d-hero-compact">
        <div className="d-hero-inner">
          <p className="d-hero-eyebrow">Community Heritage Resource Platform</p>
          <h1 className="d-hero-title">Discover Heritage Resources</h1>
          <p className="d-hero-subtitle">Browse by category — click a resource title for details</p>
          <form className="d-hero-search-wrap" onSubmit={onHeroSubmit}>
            <div className="d-search-box d-hero-search-box">
              <input
                className="d-hero-input"
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
                onFocus={() => setHeroSuggestOpen(true)}
                onBlur={() => {
                  window.setTimeout(() => setHeroSuggestOpen(false), 120);
                }}
                placeholder="Search by title"
                aria-label="Search resources"
                autoComplete="off"
              />
              {heroSuggestOpen && heroQuery.trim() && heroTitleHits.length > 0 && (
                <div className="d-suggest-box d-smart-suggest">
                  <div className="d-smart-group">
                    {heroTitleHits.map((hit) => (
                      <button
                        key={hit.id}
                        type="button"
                        className="d-suggest-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickHeroTitle(hit)}
                      >
                        <div>{hit.title}</div>
                        {hit.place && <small className="d-suggest-meta">{hit.place}</small>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button type="submit" className="d-hero-btn">
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="d-home-wrap">
        {loading && <p className="d-status">Loading categories…</p>}
        {loadError && (
          <div className="d-load-error" role="alert">
            <span>{DISCOVER_LOAD_ERROR_MESSAGE}</span>
          </div>
        )}

        {!loading &&
          !loadError &&
          sections.map(({ category, resources }) => (
            <section key={category.id} className="d-home-category-block">
              <h2 className="d-home-category-title">{category.name}</h2>
              <div className="d-home-story-row">
                {resources.map((r) => (
                  <article key={r.id} className="d-story-card">
                    <div className="d-story-image-wrap">
                      <img
                        className="d-story-cover"
                        src={thumbnailSrcOrDefault(r.fileUrl)}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_RESOURCE_COVER;
                        }}
                      />
                    </div>
                    <p className="d-story-label">{r.place || 'PLACE NOT SET'}</p>
                    <Link className="d-story-title" to={`/resources/${r.id}`}>
                      {r.title || 'Untitled'}
                    </Link>
                    <div className="d-story-stats" aria-label="Engagement">
                      <span className="d-story-stat" title="Likes">
                        <span aria-hidden="true">{'\u2764\uFE0F'}</span>{' '}
                        {Number(r.likeCount ?? 0)}
                      </span>
                      <span className="d-story-stat" title="Comments">
                        <span aria-hidden="true">{'\uD83D\uDCAC'}</span>{' '}
                        {Number(r.commentCount ?? 0)}
                      </span>
                    </div>
                  </article>
                ))}
                {resources.length === 0 && (
                  <p className="d-home-empty-cat">No resources in this category yet.</p>
                )}
              </div>
              <div className="d-home-see-all-wrap">
                <Link className="d-see-all-btn" to={`/browse/category/${category.id}`}>
                  See all relevant resources
                </Link>
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}

export default HomePage;
