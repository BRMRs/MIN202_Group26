import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getResourceDetail } from '../api/discoverApi';
import { addComment, getComments, getLikedState, likeResource, unlikeResource } from '../api/commentApi';
import { getEffectiveLikeCount, useResourceStats } from '../context/ResourceStatsContext';
import { isNotFoundError, readAxiosError } from '../utils/readAxiosError';
import '../styles/discovery.css';

const IMAGE_MEDIA_TYPES = new Set(['COVER', 'DETAIL']);
const ATTACHMENT_MEDIA_TYPES = new Set(['DOCUMENT', 'VIDEO', 'AUDIO']);

function mediaTypeOf(m) {
  return String(m?.mediaType ?? m?.media_type ?? '').toUpperCase();
}

function parseExternalLinks(raw) {
  if (raw == null || typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function hrefForExternalLink(url) {
  const u = String(url).trim();
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

/** Generic 2×2 grid icon for category badge (replaces folder emoji). */
function CategoryGridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" style={{ flexShrink: 0, display: 'block', opacity: 0.88 }}>
      <rect x="1" y="1" width="6" height="6" rx="1.2" fill="currentColor" />
      <rect x="9" y="1" width="6" height="6" rx="1.2" fill="currentColor" />
      <rect x="1" y="9" width="6" height="6" rx="1.2" fill="currentColor" />
      <rect x="9" y="9" width="6" height="6" rx="1.2" fill="currentColor" />
    </svg>
  );
}

function triggerFileDownload(fileUrl, fileName) {
  if (!fileUrl) return;
  const a = document.createElement('a');
  a.href = toPreviewAbsoluteUrl(fileUrl);
  a.download = fileName || 'download';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function toPreviewAbsoluteUrl(pathOrUrl) {
  if (pathOrUrl == null || pathOrUrl === '') return pathOrUrl;
  const s = String(pathOrUrl).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const path = s.startsWith('/') ? s : `/${s}`;
  if (typeof window === 'undefined' || !window.location?.origin) return path;
  return `${window.location.origin}${path}`;
}

/** Types browsers often show inline in a new tab; others go straight to download. */
function isLikelyBrowserPreviewable(file) {
  const name = String(file?.fileName || file?.fileUrl || '').toLowerCase();
  if (/\.(pdf|png|jpe?g|gif|webp|svg|txt)$/i.test(name)) return true;
  if (/\.(mp4|webm|ogg|mov)$/i.test(name)) return true;
  if (/\.(mp3|wav|m4a|aac)$/i.test(name)) return true;
  const t = mediaTypeOf(file);
  if (t === 'VIDEO' || t === 'AUDIO') return true;
  return false;
}

/**
 * One "查看" action: open new tab when the browser can usually preview; otherwise download.
 * Note: with noopener, window.open may return null even on success — do not treat that as failure or show alerts.
 */
function viewAttachment(file) {
  const url = file?.fileUrl;
  if (!url) return;
  const label = file?.fileName || url.split('/').pop() || 'download';
  if (isLikelyBrowserPreviewable(file)) {
    const absoluteUrl = toPreviewAbsoluteUrl(url);
    window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
  } else {
    triggerFileDownload(url, label);
  }
}

function formatCommentWhen(c) {
  const raw = c.createdAt ?? c.created_at;
  if (raw == null || raw === '') return '';
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? String(raw) : d.toLocaleString();
}

/** Interactive Image Viewer Modal — press-drag to move image; release to stop. */
function ImageZoomModal({ imageUrl, onClose, onPrev, onNext, hasMultiple }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const imgRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const positionRef = useRef({ x: 0, y: 0 });
  const dragListenersCleanupRef = useRef(null);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  const endDragListeners = () => {
    dragListenersCleanupRef.current?.();
    dragListenersCleanupRef.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setLoadError(false);
    endDragListeners();
  }, [imageUrl]);

  useEffect(() => () => dragListenersCleanupRef.current?.(), []);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale((prev) => Math.min(Math.max(0.5, prev + delta), 5));
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    endDragListeners();
    const pos = positionRef.current;
    dragOffsetRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    isDraggingRef.current = true;
    setIsDragging(true);

    const onMove = (ev) => {
      if (!isDraggingRef.current) return;
      const d = dragOffsetRef.current;
      setPosition({ x: ev.clientX - d.x, y: ev.clientY - d.y });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      dragListenersCleanupRef.current = null;
      isDraggingRef.current = false;
      setIsDragging(false);
    };
    dragListenersCleanupRef.current = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      isDraggingRef.current = false;
      setIsDragging(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    endDragListeners();
    const t = e.touches[0];
    const pos = positionRef.current;
    dragOffsetRef.current = { x: t.clientX - pos.x, y: t.clientY - pos.y };
    isDraggingRef.current = true;
    setIsDragging(true);

    const onMove = (ev) => {
      if (!isDraggingRef.current || ev.touches.length !== 1) return;
      ev.preventDefault();
      const tt = ev.touches[0];
      const d = dragOffsetRef.current;
      setPosition({ x: tt.clientX - d.x, y: tt.clientY - d.y });
    };
    const onEnd = () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
      dragListenersCleanupRef.current = null;
      isDraggingRef.current = false;
      setIsDragging(false);
    };
    dragListenersCleanupRef.current = () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
      isDraggingRef.current = false;
      setIsDragging(false);
    };
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
  };

  const resetZoom = (e) => {
    e.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const arrowStyle = {
    position: 'fixed',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    fontSize: '2em',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10001,
    transition: 'background 0.2s',
  };

  return (
    <div
      className="zoom-modal-overlay"
      onClick={onClose}
      onWheel={handleWheel}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {loadError ? (
          <div style={{ color: '#ccc', fontSize: '1.1em' }}>no image</div>
        ) : (
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Zoomed view"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              userSelect: 'none',
              pointerEvents: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
            onError={() => setLoadError(true)}
          />
        )}
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '20px',
          zIndex: 10002,
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '8px 20px',
            borderRadius: '30px',
            color: '#fff',
            fontSize: '0.9em',
            backdropFilter: 'blur(10px)',
          }}
        >
          Zoom: {Math.round(scale * 100)}% (Scroll to zoom, drag to move)
        </div>
        <button
          type="button"
          onClick={resetZoom}
          style={{
            background: '#2d6a4f',
            color: '#fff',
            border: 'none',
            padding: '8px 20px',
            borderRadius: '30px',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            style={{ ...arrowStyle, left: '30px' }}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            style={{ ...arrowStyle, right: '30px' }}
          >
            ›
          </button>
        </>
      )}

      <button
        type="button"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '30px',
          right: '30px',
          background: 'rgba(255,255,255,0.2)',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          fontSize: '1.5em',
          cursor: 'pointer',
          zIndex: 10002,
        }}
      >
        ✕
      </button>
    </div>
  );
}

function ImageGallery({ mediaFiles }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [mainImageError, setMainImageError] = useState(false);

  const len = mediaFiles?.length ?? 0;
  const safeIndex = len === 0 ? 0 : Math.min(currentIndex, len - 1);
  const current = len === 0 ? null : mediaFiles[safeIndex];

  const prev = useCallback(
    () => setCurrentIndex((i) => (i - 1 + len) % len),
    [len],
  );
  const next = useCallback(
    () => setCurrentIndex((i) => (i + 1) % len),
    [len],
  );

  useEffect(() => {
    setMainImageError(false);
  }, [safeIndex, current?.fileUrl]);

  useEffect(() => {
    if (len > 0 && currentIndex >= len) {
      setCurrentIndex(0);
    }
  }, [len, currentIndex]);

  if (!mediaFiles || mediaFiles.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          height: '360px',
          borderRadius: '10px',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
          fontSize: '0.95em',
        }}
      >
        no image
      </div>
    );
  }

  return (
    <>
      <div style={{ position: 'relative', width: '100%' }}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => !mainImageError && setModalOpen(true)}
          onKeyDown={(e) => e.key === 'Enter' && !mainImageError && setModalOpen(true)}
          style={{
            width: '100%',
            height: '360px',
            borderRadius: '10px',
            backgroundColor: '#111',
            overflow: 'hidden',
            cursor: mainImageError ? 'default' : 'zoom-in',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {mainImageError ? (
            <span style={{ color: '#aaa', fontSize: '0.95em' }}>no image</span>
          ) : (
            <img
              src={current.fileUrl}
              alt={current.fileName || `Image ${safeIndex + 1}`}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
              onError={() => setMainImageError(true)}
            />
          )}
          {!mainImageError && (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.72em',
                pointerEvents: 'none',
              }}
            >
              🔍 Click to zoom
            </div>
          )}
          {mediaFiles.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.75em',
                pointerEvents: 'none',
              }}
            >
              {safeIndex + 1} / {mediaFiles.length}
            </div>
          )}
        </div>

        {mediaFiles.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="gallery-arrow left"
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.4)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
              }}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="gallery-arrow right"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.4)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
              }}
            >
              ›
            </button>
          </>
        )}
      </div>

      {mediaFiles.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
          {mediaFiles.map((m, idx) => (
            <button
              type="button"
              key={m.id ?? idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                flexShrink: 0,
                width: '72px',
                height: '72px',
                padding: 0,
                border: 'none',
                borderRadius: '6px',
                overflow: 'hidden',
                cursor: 'pointer',
                outline: idx === safeIndex ? '3px solid #2d6a4f' : '3px solid transparent',
                opacity: idx === safeIndex ? 1 : 0.6,
                transition: 'opacity 0.15s, outline 0.15s',
              }}
            >
              <img src={m.fileUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}

      {modalOpen && !mainImageError && (
        <ImageZoomModal
          imageUrl={current.fileUrl}
          onClose={() => setModalOpen(false)}
          onPrev={prev}
          onNext={next}
          hasMultiple={mediaFiles.length > 1}
        />
      )}
    </>
  );
}

function ResourceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    setCommentCountForResource,
    likeCountByResourceId,
    setLikeCountForResource,
    seedLikeCountIfAbsent,
    setUserLikedForResource,
  } = useResourceStats();

  const [resource, setResource] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showEmptyModal, setShowEmptyModal] = useState(false);

  useEffect(() => {
    if (id == null || String(id).trim() === '') {
      setLoading(false);
      setResource(null);
      setError('Invalid resource link.');
      return undefined;
    }

    let cancelled = false;
    const load = async () => {
      setResource(null);
      setComments([]);
      setNewComment('');
      setIsLiked(false);
      setLoading(true);
      setError(null);
      try {
        const detailRes = await getResourceDetail(id);
        const resData = detailRes.data;
        const [commentList, likedPayload] = await Promise.all([
          getComments(id).catch(() => []),
          getLikedState(id).catch(() => ({ liked: false, authenticated: false })),
        ]);
        if (cancelled) return;
        setResource(resData);
        const list = Array.isArray(commentList) ? commentList : [];
        setComments(list);
        setCommentCountForResource(id, list.length);
        seedLikeCountIfAbsent(id, resData?.likeCount ?? 0);
        if (likedPayload?.authenticated) {
          setUserLikedForResource(id, Boolean(likedPayload.liked));
          setIsLiked(Boolean(likedPayload.liked));
        } else {
          setIsLiked(false);
        }
      } catch (err) {
        if (cancelled) return;
        if (isNotFoundError(err)) {
          setError('This resource was not found or is not available for public viewing.');
        } else {
          setError(readAxiosError(err, "We couldn't load this resource. Please try again."));
        }
        setResource(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, setCommentCountForResource, seedLikeCountIfAbsent, setUserLikedForResource]);

  const { imageMedia, attachmentMedia, externalLinks } = useMemo(() => {
    if (!resource) {
      return { imageMedia: [], attachmentMedia: [], externalLinks: [] };
    }
    const raw = Array.isArray(resource.media) ? resource.media : [];
    const images = [];
    const attachments = [];
    for (const m of raw) {
      const t = mediaTypeOf(m);
      if (IMAGE_MEDIA_TYPES.has(t)) images.push(m);
      else if (ATTACHMENT_MEDIA_TYPES.has(t)) attachments.push(m);
    }
    if (images.length === 0 && resource.fileUrl) {
      images.push({
        id: 'legacy-cover',
        fileUrl: resource.fileUrl,
        fileName: null,
        mediaType: 'DETAIL',
      });
    }
    return {
      imageMedia: images,
      attachmentMedia: attachments,
      externalLinks: parseExternalLinks(resource.externalLink),
    };
  }, [resource]);

  const handleSendComment = async () => {
    if (!newComment.trim()) {
      setShowEmptyModal(true);
      return;
    }
    if (newComment.length > 500) return;
    try {
      setIsSubmitting(true);
      const res = await addComment(id, newComment);
      const payload = res.data?.data ?? res.data;
      const addedComment =
        payload && typeof payload === 'object' && payload.content
          ? payload
          : {
              id: Date.now(),
              content: newComment,
              createdAt: new Date().toISOString(),
              user: { id: 1, username: 'You' },
            };
      setComments((prev) => {
        const next = [addedComment, ...prev];
        setCommentCountForResource(id, next.length);
        return next;
      });
      setNewComment('');
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        alert('Please log in to post a comment.');
      } else {
        alert(readAxiosError(err, 'Failed to post comment.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async () => {
    const base = getEffectiveLikeCount(resource, likeCountByResourceId);
    try {
      if (isLiked) {
        await unlikeResource(id);
        const next = Math.max(0, base - 1);
        setLikeCountForResource(id, next);
        setUserLikedForResource(id, false);
        setIsLiked(false);
      } else {
        await likeResource(id);
        const next = base + 1;
        setLikeCountForResource(id, next);
        setUserLikedForResource(id, true);
        setIsLiked(true);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Please log in to like resources.');
      } else {
        alert(readAxiosError(err, 'Could not update like.'));
      }
    }
  };

  if (loading) {
    return (
      <div className="d-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <p className="d-status">Loading resource details…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-page">
        <div className="d-load-error" role="alert" style={{ marginTop: '40px' }}>
          <span>⚠ {error}</span>
          <button className="d-retry" type="button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="d-page" style={{ paddingTop: '40px' }}>
        <p style={{ color: '#999' }}>Resource not found.</p>
      </div>
    );
  }

  const isArchived = String(resource.status || '') === 'ARCHIVED';
  const likeCountDisplayed = getEffectiveLikeCount(resource, likeCountByResourceId);
  const commentCountDisplayed = comments.length;
  const commentCountLabel = commentCountDisplayed === 1 ? 'Comment' : 'Comments';

  const statusBadge = (status) => {
    const map = {
      APPROVED: { bg: '#d4edda', color: '#155724' },
      ARCHIVED: { bg: '#fff3cd', color: '#856404' },
      DRAFT: { bg: '#e2e3e5', color: '#383d41' },
    };
    const s = map[status] || { bg: '#e2e3e5', color: '#383d41' };
    return (
      <span style={{ ...s, padding: '3px 10px', borderRadius: '4px', fontSize: '0.8em', fontWeight: 'bold' }}>{status}</span>
    );
  };

  return (
    <div className="d-page" style={{ maxWidth: '1050px', margin: '0 auto', minWidth: 0, overflowX: 'hidden' }}>
      <button
        type="button"
        className="d-button d-button-secondary"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
        style={{ marginBottom: '20px' }}
      >
        ← Back
      </button>

      {isArchived && (
        <div
          className="d-detail-meta-text"
          style={{
            padding: '12px 18px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            color: '#856404',
            marginBottom: '20px',
            fontSize: '0.92em',
          }}
        >
          📦 <strong>This resource has been archived.</strong> It is no longer publicly listed on the browse page. Likes and comments are
          disabled.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', minWidth: 0 }}>
        <div style={{ width: '100%', minWidth: 0 }}>
          <ImageGallery mediaFiles={imageMedia} />
        </div>

        <div style={{ width: '100%', minWidth: 0 }}>
          <h1
            className="d-detail-title-wrap"
            style={{ marginTop: 0, fontSize: '1.5em', lineHeight: 1.35, color: '#1a3a2e' }}
          >
            {resource.title || 'Not provided'}
          </h1>
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {resource.status && statusBadge(resource.status)}
            {resource.categoryName && (
              <span
                style={{
                  background: '#ecfdf5',
                  color: '#166534',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.8em',
                  fontWeight: 600,
                  border: '1px solid #bbf7d0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CategoryGridIcon />
                {resource.categoryName}
              </span>
            )}
          </div>
          {resource.place && (
            <p className="d-detail-meta-text" style={{ color: '#666', margin: '0 0 8px' }}>
              📍 <strong>Place:</strong> {resource.place}
            </p>
          )}
          <p className="d-detail-prose" style={{ color: '#333', lineHeight: 1.65, margin: '12px 0' }}>
            {resource.description || 'Not provided'}
          </p>
          {resource.tags && resource.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {resource.tags.map((tag) => (
                <span
                  key={tag.id || tag.name}
                  style={{
                    background: '#f0fdf4',
                    color: '#2d6a4f',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '0.78em',
                    border: '1px solid #bbf7d0',
                    fontWeight: 500,
                  }}
                >
                  # {tag.name}
                </span>
              ))}
            </div>
          )}

          {(attachmentMedia.length > 0 || externalLinks.length > 0) && (
            <div
              style={{
                marginTop: '4px',
                marginBottom: '16px',
                border: '1px solid #c5ddd0',
                borderRadius: '12px',
                padding: '14px 16px',
                background: 'linear-gradient(180deg, #f8fdf9 0%, #f4faf7 100%)',
              }}
            >
              <h3 style={{ margin: '0 0 12px', fontSize: '0.95em', color: '#1a3a2e', fontWeight: 700 }}>Files & links</h3>
              {attachmentMedia.length > 0 && (
                <div style={{ marginBottom: externalLinks.length > 0 ? 14 : 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.82em', color: '#6b7280', marginBottom: 8 }}>Attached files</div>
                  <ul style={{ margin: 0, paddingLeft: '1.1em', fontSize: '0.88em' }}>
                    {attachmentMedia.map((m) => {
                      const label = m.fileName || m.fileUrl || 'File';
                      return (
                        <li
                          key={m.id ?? `${m.fileUrl}-${m.fileName}`}
                          style={{
                            marginBottom: 10,
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: '8px 12px',
                          }}
                        >
                          <span style={{ flex: '1 1 140px', minWidth: 0, wordBreak: 'break-all' }}>{label}</span>
                          {mediaTypeOf(m) ? (
                            <span style={{ fontSize: '0.85em', color: '#9ca3af' }}>{mediaTypeOf(m)}</span>
                          ) : null}
                          <button
                            type="button"
                            className="d-button"
                            onClick={() => viewAttachment(m)}
                            style={{ padding: '6px 12px', fontSize: '0.82em' }}
                          >
                            查看
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {externalLinks.length > 0 && (
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.82em', color: '#6b7280', marginBottom: 8 }}>External links</div>
                  <ul style={{ margin: 0, paddingLeft: '1.1em', fontSize: '0.88em' }}>
                    {externalLinks.map((url) => (
                      <li key={url} style={{ marginBottom: 6, wordBreak: 'break-all' }}>
                        <a
                          href={hrefForExternalLink(url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="d-link"
                          style={{ fontWeight: 500 }}
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div
            className="d-detail-meta-text"
            style={{
              background: '#f4faf7',
              padding: '14px 16px',
              borderRadius: '12px',
              fontSize: '0.88em',
              lineHeight: 2,
              border: '1px solid #d5e8dd',
            }}
          >
            <div>
              <strong>Contributor:</strong> {resource.contributor?.username || 'Not provided'}
            </div>
            <div>
              <strong>Copyright:</strong> {resource.copyrightDeclaration || 'Not provided'}
            </div>
            <div>
              <strong>Published:</strong>{' '}
              {resource.createdAt ? new Date(resource.createdAt).toLocaleDateString() : 'Not provided'}
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              onClick={isArchived ? undefined : handleToggleLike}
              disabled={isArchived}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid #dee2e6',
                backgroundColor: isArchived ? '#f5f5f5' : isLiked ? '#fff0f0' : '#fff',
                color: isArchived ? '#bbb' : isLiked ? '#ff4d4f' : '#666',
                cursor: isArchived ? 'not-allowed' : 'pointer',
                opacity: isArchived ? 0.55 : 1,
                fontSize: '0.92em',
                transition: 'all 0.2s',
              }}
            >
              <span>{isLiked && !isArchived ? '❤️' : '🤍'}</span>
              <span>{likeCountDisplayed}</span>
            </button>
            <span style={{ color: '#666', fontSize: '0.92em' }}>
              💬 {commentCountDisplayed} {commentCountLabel}
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '50px', borderTop: '1px solid #c5ddd0', paddingTop: '30px', minWidth: 0 }}>
        <h3 style={{ marginTop: 0, color: '#1a3a2e', letterSpacing: '-0.02em' }}>Comments</h3>
        {isArchived ? (
          <div
            style={{
              padding: '12px 16px',
              background: '#f5f5f5',
              borderRadius: '8px',
              color: '#999',
              fontSize: '0.9em',
              marginBottom: '24px',
            }}
          >
            💬 Comments are disabled for archived resources. Existing comments are shown below for reference.
          </div>
        ) : (
          <div style={{ marginBottom: '28px' }}>
            <textarea
              className="d-detail-textarea"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={isSubmitting}
              placeholder="Write a comment (max 500 characters)…"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8em', color: newComment.length > 500 ? 'red' : '#999' }}>
                {newComment.length} / 500
              </span>
              <button
                type="button"
                className="d-button"
                onClick={handleSendComment}
                disabled={isSubmitting || newComment.length > 500}
                style={{ padding: '8px 22px' }}
              >
                {isSubmitting ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>
          {comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.id} className="d-comment-row">
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#d8ede2',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1em',
                    color: '#2d6a4f',
                  }}
                >
                  {(c.user?.username || '?')[0].toUpperCase()}
                </div>
                <div className="d-comment-body">
                  <div
                    className="d-detail-title-wrap"
                    style={{ fontWeight: 'bold', fontSize: '0.88em' }}
                  >
                    {c.user?.username || 'Anonymous'}
                    <span style={{ fontWeight: 'normal', color: '#aaa', marginLeft: '10px', fontSize: '0.85em' }}>
                      {formatCommentWhen(c)}
                    </span>
                  </div>
                  <p className="d-comment-text">{c.content}</p>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#aaa', fontSize: '0.9em' }}>No comments yet. Be the first to share your thoughts!</p>
          )}
        </div>
      </div>

      {showEmptyModal && (
        <div
          role="presentation"
          onClick={() => setShowEmptyModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9998,
            backdropFilter: 'blur(2px)',
          }}
        >
          <div
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              padding: '32px',
              borderRadius: '12px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
              textAlign: 'center',
              maxWidth: '380px',
              width: '90%',
              borderTop: '4px solid #2d6a4f',
            }}
          >
            <div style={{ fontSize: '2.8em', marginBottom: '8px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 10px', color: '#333' }}>Cannot be empty</h3>
            <p style={{ color: '#666', margin: '0 0 22px', fontSize: '0.9em' }}>Please write something before posting a comment.</p>
            <button type="button" className="d-button" onClick={() => setShowEmptyModal(false)} style={{ padding: '10px 36px' }}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResourceDetailPage;
