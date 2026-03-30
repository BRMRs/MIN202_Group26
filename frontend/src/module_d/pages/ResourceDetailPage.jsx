import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResourceDetail } from '../api/discoverApi';
import { getComments, addComment, likeResource, unlikeResource } from '../api/commentApi';
import {
  getEffectiveLikeCount,
  useResourceStats,
} from '../context/ResourceStatsContext';
import '../styles/discovery.css';

/**
 * Resource Detail Page — Module D
 * PBI 4.4: View Resource Details + Interactive Image Viewer (Zoom & Pan)
 * PBI 4.5: Basic Commenting and Feedback
 */

/* ── Interactive Image Viewer Modal ── */
function ImageZoomModal({ imageUrl, onClose, onPrev, onNext, hasMultiple }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDraftStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);

  // Reset zoom when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [imageUrl]);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale(prev => Math.min(Math.max(0.5, prev + delta), 5));
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDraftStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetZoom = (e) => {
    e.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const arrowStyle = {
    position: 'fixed', top: '50%', transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none',
    borderRadius: '50%', width: '50px', height: '50px', fontSize: '2em',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10001, transition: 'background 0.2s',
  };

  return (
    <div
      className="zoom-modal-overlay"
      onClick={onClose}
      onWheel={handleWheel}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        overflow: 'hidden', touchAction: 'none'
      }}
    >
      <div
        style={{
          position: 'relative', width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Zoomed view"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            maxWidth: '90%', maxHeight: '90%', objectFit: 'contain',
            userSelect: 'none', pointerEvents: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
          onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/800/600'; }}
        />
      </div>

      {/* Controls UI */}
      <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '20px', zIndex: 10002 }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '30px', color: '#fff', fontSize: '0.9em', backdropFilter: 'blur(10px)' }}>
          Zoom: {Math.round(scale * 100)}% (Scroll to zoom, Drag to move)
        </div>
        <button onClick={resetZoom} style={{ background: '#007bff', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '30px', cursor: 'pointer' }}>
          Reset
        </button>
      </div>

      {/* Navigation Arrows */}
      {hasMultiple && (
        <>
          <button onClick={(e) => { e.stopPropagation(); onPrev(); }} style={{ ...arrowStyle, left: '30px' }} onMouseEnter={e => e.target.style.background='rgba(255,255,255,0.2)'} onMouseLeave={e => e.target.style.background='rgba(255,255,255,0.1)'}>‹</button>
          <button onClick={(e) => { e.stopPropagation(); onNext(); }} style={{ ...arrowStyle, right: '30px' }} onMouseEnter={e => e.target.style.background='rgba(255,255,255,0.2)'} onMouseLeave={e => e.target.style.background='rgba(255,255,255,0.1)'}>›</button>
        </>
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed', top: '30px', right: '30px',
          background: 'rgba(255,255,255,0.2)', color: '#fff',
          border: 'none', borderRadius: '50%', width: '44px', height: '44px',
          fontSize: '1.5em', cursor: 'pointer', zIndex: 10002
        }}
      >✕</button>
    </div>
  );
}

/* ── Image Gallery subcomponent ── */
function ImageGallery({ mediaFiles }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const prev = useCallback(() =>
    setCurrentIndex(i => (i - 1 + mediaFiles.length) % mediaFiles.length), [mediaFiles.length]);
  const next = useCallback(() =>
    setCurrentIndex(i => (i + 1) % mediaFiles.length), [mediaFiles.length]);

  if (!mediaFiles || mediaFiles.length === 0) {
    return (
      <div style={{
        width: '100%', height: '360px', borderRadius: '10px',
        backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#aaa', fontSize: '0.95em',
      }}>
        No Media Available
      </div>
    );
  }

  const current = mediaFiles[currentIndex];

  return (
    <>
      <div style={{ position: 'relative', width: '100%' }}>
        <div
          onClick={() => setModalOpen(true)}
          style={{
            width: '100%', height: '360px', borderRadius: '10px',
            backgroundColor: '#111', overflow: 'hidden',
            cursor: 'zoom-in', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <img
            src={current.fileUrl}
            alt={current.fileName || `Image ${currentIndex + 1}`}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
            onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/800/600'; }}
          />
          <div style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'rgba(0,0,0,0.5)', color: '#fff',
            padding: '3px 8px', borderRadius: '4px', fontSize: '0.72em', pointerEvents: 'none',
          }}>
            🔍 Click to zoom
          </div>
          {mediaFiles.length > 1 && (
            <div style={{
              position: 'absolute', bottom: '10px', right: '10px',
              background: 'rgba(0,0,0,0.5)', color: '#fff',
              padding: '3px 8px', borderRadius: '4px', fontSize: '0.75em', pointerEvents: 'none',
            }}>
              {currentIndex + 1} / {mediaFiles.length}
            </div>
          )}
        </div>

        {mediaFiles.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="gallery-arrow left"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer' }}
            >‹</button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="gallery-arrow right"
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer' }}
            >›</button>
          </>
        )}
      </div>

      {mediaFiles.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
          {mediaFiles.map((m, idx) => (
            <button
              key={m.id ?? idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                flexShrink: 0, width: '72px', height: '72px', padding: 0, border: 'none',
                borderRadius: '6px', overflow: 'hidden', cursor: 'pointer',
                outline: idx === currentIndex ? '3px solid #007bff' : '3px solid transparent',
                opacity: idx === currentIndex ? 1 : 0.6,
                transition: 'opacity 0.15s, outline 0.15s',
              }}
            >
              <img src={m.fileUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}

      {modalOpen && (
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

/* ── Main page ── */
function ResourceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    setCommentCountForResource,
    likeCountByResourceId,
    userLikedByResourceId,
    setLikeCountForResource,
    seedLikeCountIfAbsent,
    setUserLikedForResource,
  } = useResourceStats();

  const [resource, setResource]   = useState(null);
  const [comments, setComments]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiked, setIsLiked]     = useState(false);
  const [showEmptyModal, setShowEmptyModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // 先取资源详情，再用 _mockId 辅助查询评论
        const resRes = await getResourceDetail(id);
        const mockId = resRes.data?._mockId;
        const comRes = await getComments(id, mockId);
        const list = comRes.data.data ?? [];
        if (!cancelled) {
          setResource(resRes.data);
          setComments(list);
          setCommentCountForResource(id, list.length);
          seedLikeCountIfAbsent(id, resRes.data?.likeCount ?? 0);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Network error. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id, setCommentCountForResource, seedLikeCountIfAbsent]);

  /** 与 Context 同步：返回详情页时沿用本会话内的红心状态 */
  useEffect(() => {
    if (id == null) return;
    setIsLiked(userLikedByResourceId[String(id)] === true);
  }, [id, userLikedByResourceId]);

  const handleSendComment = async () => {
    if (!newComment.trim()) { setShowEmptyModal(true); return; }
    if (newComment.length > 500) return;
    try {
      setIsSubmitting(true);
      const res = await addComment(id, newComment);
      const addedComment = res.data.data || {
        id: Date.now(),
        content: newComment,
        createdAt: new Date().toISOString(),
        user: { id: 1, username: 'CurrentUser' }
      };
      setComments((prev) => {
        const next = [addedComment, ...prev];
        setCommentCountForResource(id, next.length);
        return next;
      });
      setNewComment('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post comment.');
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
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="d-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <p className="d-status">Loading resource details…</p>
    </div>
  );

  if (error) return (
    <div className="d-page">
      <div className="d-load-error" role="alert" style={{ marginTop: '40px' }}>
        <span>⚠ {error}</span>
        <button className="d-retry" type="button" onClick={() => window.location.reload()}>Retry</button>
      </div>
    </div>
  );

  if (!resource) return (
    <div className="d-page" style={{ paddingTop: '40px' }}>
      <p style={{ color: '#999' }}>Resource not found.</p>
    </div>
  );

  const isArchived = resource.status === 'ARCHIVED';
  const mediaFiles = resource.media || [];
  /** 与列表/Context 一致：本会话内点过赞后仍以共享状态为准，避免接口旧值覆盖 */
  const likeCountDisplayed = getEffectiveLikeCount(resource, likeCountByResourceId);
  /** 与下方评论列表一致：条数来自当前已加载的评论，发帖后随列表递增 */
  const commentCountDisplayed = comments.length;
  const commentCountLabel = commentCountDisplayed === 1 ? 'Comment' : 'Comments';

  const statusBadge = (status) => {
    const map = {
      APPROVED: { bg: '#d4edda', color: '#155724' },
      ARCHIVED: { bg: '#fff3cd', color: '#856404' },
      DRAFT:    { bg: '#e2e3e5', color: '#383d41' },
    };
    const s = map[status] || { bg: '#e2e3e5', color: '#383d41' };
    return (
      <span style={{ ...s, padding: '3px 10px', borderRadius: '4px', fontSize: '0.8em', fontWeight: 'bold' }}>{status}</span>
    );
  };

  return (
    <div className="d-page" style={{ maxWidth: '1050px', margin: '0 auto' }}>
      <button
        className="d-button d-button-secondary"
        onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
        style={{ marginBottom: '20px' }}
      >
        ← Back
      </button>

      {isArchived && (
        <div style={{ padding: '12px 18px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', color: '#856404', marginBottom: '20px', fontSize: '0.92em' }}>
          📦 <strong>This resource has been archived.</strong> It is no longer publicly listed on the browse page. Likes and comments are disabled.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div>
          <ImageGallery mediaFiles={mediaFiles} />
        </div>

        <div>
          <h1 style={{ marginTop: 0, fontSize: '1.5em', lineHeight: 1.35 }}>{resource.title || 'Not provided'}</h1>
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {statusBadge(resource.status)}
            {resource.categoryName && (
              <span style={{ background: '#e9ecef', color: '#495057', padding: '3px 10px', borderRadius: '4px', fontSize: '0.8em' }}>
                📁 {resource.categoryName}
              </span>
            )}
          </div>
          {resource.place && <p style={{ color: '#666', margin: '0 0 8px' }}>📍 <strong>Place:</strong> {resource.place}</p>}
          <p style={{ whiteSpace: 'pre-wrap', color: '#333', lineHeight: 1.65, margin: '12px 0' }}>{resource.description || 'Not provided'}</p>
          
          {resource.tags && resource.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {resource.tags.map(tag => (
                <span key={tag.id || tag.name} style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 10px', borderRadius: '12px', fontSize: '0.78em' }}># {tag.name}</span>
              ))}
            </div>
          )}

          <div style={{ background: '#f8f9fa', padding: '14px 16px', borderRadius: '8px', fontSize: '0.88em', lineHeight: 2 }}>
            <div><strong>Contributor:</strong> {resource.contributor?.username || 'Not provided'}</div>
            <div><strong>Copyright:</strong> {resource.copyrightDeclaration || 'Not provided'}</div>
            <div><strong>External link:</strong> {resource.externalLink ? <a href={resource.externalLink} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>View source ↗</a> : 'Not provided'}</div>
            <div><strong>Published:</strong> {resource.createdAt ? new Date(resource.createdAt).toLocaleDateString() : 'Not provided'}</div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              onClick={isArchived ? undefined : handleToggleLike}
              disabled={isArchived}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px', border: '1px solid #dee2e6', backgroundColor: isArchived ? '#f5f5f5' : isLiked ? '#fff0f0' : '#fff', color: isArchived ? '#bbb' : isLiked ? '#ff4d4f' : '#666', cursor: isArchived ? 'not-allowed' : 'pointer', opacity: isArchived ? 0.55 : 1, fontSize: '0.92em', transition: 'all 0.2s' }}
            >
              <span>{isLiked && !isArchived ? '❤️' : '🤍'}</span>
              <span>{likeCountDisplayed}</span>
            </button>
            <span style={{ color: '#666', fontSize: '0.92em' }}>💬 {commentCountDisplayed} {commentCountLabel}</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '50px', borderTop: '1px solid #dee2e6', paddingTop: '30px' }}>
        <h3 style={{ marginTop: 0 }}>Comments</h3>
        {isArchived ? (
          <div style={{ padding: '12px 16px', background: '#f5f5f5', borderRadius: '8px', color: '#999', fontSize: '0.9em', marginBottom: '24px' }}>💬 Comments are disabled for archived resources. Existing comments are shown below for reference.</div>
        ) : (
          <div style={{ marginBottom: '28px' }}>
            <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} disabled={isSubmitting} placeholder="Write a comment (max 500 characters)…" style={{ width: '100%', height: '88px', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', resize: 'vertical', fontSize: '0.9em' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8em', color: newComment.length > 500 ? 'red' : '#999' }}>{newComment.length} / 500</span>
              <button className="d-button" onClick={handleSendComment} disabled={isSubmitting || newComment.length > 500} style={{ padding: '8px 22px' }}>{isSubmitting ? 'Sending…' : 'Send'}</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {comments.length > 0 ? comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#dee2e6', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1em', color: '#6c757d' }}>{(c.user?.username || '?')[0].toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.88em' }}>{c.user?.username || 'Anonymous'}<span style={{ fontWeight: 'normal', color: '#aaa', marginLeft: '10px', fontSize: '0.85em' }}>{new Date(c.createdAt ?? c.created_at).toLocaleString()}</span></div>
                <p style={{ margin: '4px 0 0', fontSize: '0.9em', lineHeight: 1.55 }}>{c.content}</p>
              </div>
            </div>
          )) : <p style={{ color: '#aaa', fontSize: '0.9em' }}>No comments yet. Be the first to share your thoughts!</p>}
        </div>
      </div>

      {showEmptyModal && (
        <div onClick={() => setShowEmptyModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998, backdropFilter: 'blur(2px)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.2)', textAlign: 'center', maxWidth: '380px', width: '90%' }}>
            <div style={{ fontSize: '2.8em', marginBottom: '8px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 10px', color: '#333' }}>Cannot be empty</h3>
            <p style={{ color: '#666', margin: '0 0 22px', fontSize: '0.9em' }}>Please write something before posting a comment.</p>
            <button className="d-button" onClick={() => setShowEmptyModal(false)} style={{ padding: '10px 36px' }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResourceDetailPage;
