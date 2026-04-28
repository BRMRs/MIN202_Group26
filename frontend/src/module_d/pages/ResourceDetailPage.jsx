/**
 * Resource Detail Page — Module D
 * PBI 4.4: Task: "Detail page UI for title, description, metadata, and media files"
 *          Task: "Implement interactive image viewer (enlarge and switch multiple images)"
 *          Task: "Configure external links to open in a new browser tab"
 *          Task: "Handle empty fields by displaying 'Not provided' and add network error states"
 *          Task: "Implement state retention logic for the 'Back' button to preserve search/filter states"
 * PBI 4.5: Task: "Comment section UI development (text area, 'Send' button, like icon)"
 *          Task: "Create POST API for comments, storing username and timestamp"
 *          Task: "Implement input validation (prevent empty comments, enforce 500-character limit)"
 *          Task: "Add backend check to prevent commenting if the resource status changes to 'Archived'"
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getResourceDetail } from '../api/discoverApi';
import { addComment, getComments, getLikedState, likeResource, unlikeResource } from '../api/commentApi';
import { getEffectiveLikeCount, useResourceStats } from '../context/ResourceStatsContext';
import { isNotFoundError, readAxiosError } from '../utils/readAxiosError';
import { DEFAULT_RESOURCE_COVER } from '../utils/defaultResourceCover';
import {
  attachmentKindLabel,
  mediaTypeOf,
  partitionResourceDetailMedia,
} from '../utils/resourceMediaPartition';
import '../styles/discovery.css';

function hrefForExternalLink(url) {
  const u = String(url).trim();
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

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

function MapPinIcon({ size = 18, innerFill = '#ffffff' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <path
        fill="currentColor"
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
      />
      <circle cx="12" cy="9" r="3" fill={innerFill} />
    </svg>
  );
}

function MagnifyingGlassIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      <path
        fill="currentColor"
        d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
      />
    </svg>
  );
}

function WarningTriangleIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      <path
        fill="currentColor"
        d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
      />
    </svg>
  );
}

function ArchiveBoxIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      <path
        fill="currentColor"
        d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"
      />
    </svg>
  );
}

function HeartFilledIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      <path
        fill="currentColor"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>
  );
}

function HeartOutlineIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      <path
        fill="currentColor"
        d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"
      />
    </svg>
  );
}

function ChatBubbleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      <path
        fill="currentColor"
        d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"
      />
    </svg>
  );
}

function ChevronLeftIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </svg>
  );
}

function ChevronThinLeftIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2.2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronThinRightIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2.2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  );
}

function CloseXIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
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

function isLikelyBrowserPreviewable(file) {
  const name = String(file?.fileName || file?.fileUrl || '').toLowerCase();
  if (/\.(pdf|png|jpe?g|gif|webp|svg|txt)$/i.test(name)) return true;
  if (/\.(mp4|webm|ogg|mov)$/i.test(name)) return true;
  if (/\.(mp3|wav|m4a|aac)$/i.test(name)) return true;
  const t = mediaTypeOf(file);
  if (t === 'VIDEO' || t === 'AUDIO') return true;
  return false;
}

// PBI 4.4 — external links / attachments: preview in new tab when possible, else download (noopener may yield null; ignore)
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

// PBI 4.4 — full-screen image viewer: zoom, drag, prev/next
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
          <img
            src={DEFAULT_RESOURCE_COVER}
            alt=""
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
          />
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
            <ChevronThinLeftIcon size={28} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            style={{ ...arrowStyle, right: '30px' }}
          >
            <ChevronThinRightIcon size={28} />
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
          cursor: 'pointer',
          zIndex: 10002,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CloseXIcon size={22} />
      </button>
    </div>
  );
}

// PBI 4.4 — image gallery, zoom, multi-image
function ImageGallery({ mediaFiles, fallbackCoverUrl = DEFAULT_RESOURCE_COVER }) {
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
          overflow: 'hidden',
          border: '1px solid #d5e8dd',
          backgroundColor: '#f4faf7',
        }}
      >
        <img
          src={fallbackCoverUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
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
            <img
              src={fallbackCoverUrl}
              alt=""
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover', display: 'block' }}
            />
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
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <MagnifyingGlassIcon size={13} />
                Click to zoom
              </span>
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronThinLeftIcon size={22} />
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronThinRightIcon size={22} />
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
              <img
                src={m.fileUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_RESOURCE_COVER;
                }}
              />
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // PBI 4.5 — sign-in required modal: 'like' | 'comment'
  const [loginPrompt, setLoginPrompt] = useState(null);
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
      setIsAuthenticated(false);
      setLoginPrompt(null);
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
        setIsAuthenticated(Boolean(likedPayload?.authenticated));
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

  const { imageMedia, attachmentMedia, externalLinks } = useMemo(
    () => partitionResourceDetailMedia(resource),
    [resource],
  );

  const visibleTags = useMemo(() => {
    const raw = resource?.tags;
    if (!Array.isArray(raw)) return [];
    return raw.filter((tag) => tag && !tag.isDeleted && !tag.is_deleted);
  }, [resource?.tags]);

  const handleSendComment = async () => {
    if (!isAuthenticated) {
      setLoginPrompt('comment');
      return;
    }
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
        setIsAuthenticated(false);
        setLoginPrompt('comment');
      } else {
        alert(readAxiosError(err, 'Failed to post comment.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      setLoginPrompt('like');
      return;
    }
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
        setIsAuthenticated(false);
        setLoginPrompt('like');
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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#b45309', display: 'flex' }}>
              <WarningTriangleIcon size={20} />
            </span>
            {error}
          </span>
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

  // -------------------------------------------------------------------
  // PBI 4.4 — Task: "Detail page UI" (Our Mission strip: clip paths)
  // -------------------------------------------------------------------
  const missionClip =
    'polygon(0 0, calc(100% - 108px) 0, 100% 108px, 100% 100%, 0 100%)';
  const missionGreenClip =
    'polygon(0 0, calc(100% - 108px) 0, 100% 108px, 100% 56%, 0 56%)';

  return (
    <>
    <div className="d-page" style={{ maxWidth: '1050px', margin: '0 auto', minWidth: 0, overflowX: 'hidden' }}>
      <button
        type="button"
        className="d-button d-button-secondary"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
        style={{ marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <ChevronLeftIcon size={20} />
        Back
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
          <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ color: '#856404', marginTop: 2, flexShrink: 0 }}>
              <ArchiveBoxIcon size={20} />
            </span>
            <span>
              <strong>This resource has been archived.</strong> It is no longer publicly listed on the browse page. Likes and comments are
              disabled.
            </span>
          </span>
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
            <p
              className="d-detail-meta-text"
              style={{
                margin: '0 0 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ color: '#ff4d4f', display: 'inline-flex' }} aria-hidden>
                <MapPinIcon size={18} />
              </span>
              <strong style={{ color: '#666' }}>Place:</strong>{' '}
              <span style={{ color: '#000' }}>{resource.place}</span>
            </p>
          )}
          <p className="d-detail-prose" style={{ color: '#333', lineHeight: 1.65, margin: '12px 0' }}>
            {resource.description || 'Not provided'}
          </p>
          {visibleTags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {visibleTags.map((tag) => (
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
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {attachmentMedia.length > 0 && (
                <div
                  style={{
                    border: '1px solid #c5ddd0',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    background: 'linear-gradient(180deg, #f8fdf9 0%, #f4faf7 100%)',
                  }}
                >
                  <h3 style={{ margin: '0 0 12px', fontSize: '0.95em', color: '#1a3a2e', fontWeight: 700 }}>
                    Attachments
                  </h3>
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
                          <span style={{ fontSize: '0.85em', color: '#9ca3af' }}>{attachmentKindLabel(m)}</span>
                          <button
                            type="button"
                            className="d-button"
                            onClick={() => viewAttachment(m)}
                            style={{ padding: '6px 12px', fontSize: '0.82em' }}
                          >
                            View
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {externalLinks.length > 0 && (
                <div
                  style={{
                    border: '1px solid #c5ddd0',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    background: 'linear-gradient(180deg, #f8fdf9 0%, #f4faf7 100%)',
                  }}
                >
                  <h3 style={{ margin: '0 0 12px', fontSize: '0.95em', color: '#1a3a2e', fontWeight: 700 }}>
                    Links
                  </h3>
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
              <span
                style={{
                  display: 'inline-flex',
                  color: isArchived ? '#bbb' : isLiked ? '#ff4d4f' : '#9ca3af',
                }}
                aria-hidden
              >
                {isLiked && !isArchived ? <HeartFilledIcon size={18} /> : <HeartOutlineIcon size={18} />}
              </span>
              <span>{likeCountDisplayed}</span>
            </button>
            <span
              style={{
                color: '#666',
                fontSize: '0.92em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ color: '#6b7280', display: 'inline-flex' }} aria-hidden>
                <ChatBubbleIcon size={17} />
              </span>
              {commentCountDisplayed} {commentCountLabel}
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
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <span style={{ color: '#9ca3af', flexShrink: 0, marginTop: 1 }} aria-hidden>
              <ChatBubbleIcon size={18} />
            </span>
            <span>Comments are disabled for archived resources. Existing comments are shown below for reference.</span>
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
    </div>

    <div
      style={{
        width: '100vw',
        marginLeft: 'calc(50% - 50vw)',
        marginRight: 'calc(50% - 50vw)',
        marginTop: '48px',
        position: 'relative',
        zIndex: 0,
        isolation: 'isolate',
        overflow: 'hidden',
        /* PBI 4.4 */
        background: '#ffffff',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          background: 'linear-gradient(125deg, #166534 0%, #2d6a4f 45%, #1b4332 100%)',
          clipPath: missionGreenClip,
          transform: 'translate(38px, 6px)',
          opacity: 0.96,
          zIndex: 1,
        }}
      />
      {/* PBI 4.4 — mission strip (white corner) */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 'min(140px, 28%)',
          height: 'min(140px, 28%)',
          background: '#ffffff',
          clipPath: 'polygon(100% 0, 100% 32px, calc(100% - 32px) 0)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
      <section
        aria-labelledby="our-mission-heading"
        style={{
          position: 'relative',
          zIndex: 3,
          /* PBI 4.4 */
          background: '#000',
          color: '#fff',
          clipPath: missionClip,
          padding: '36px clamp(18px, 5vw, 72px) 44px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
          <h2
            id="our-mission-heading"
            style={{
              margin: '0 0 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#fff',
              fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
            }}
          >
            OUR MISSION
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '0.98rem',
              lineHeight: 1.65,
              fontStyle: 'italic',
              color: '#fff',
              fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
              maxWidth: '52em',
            }}
          >
            We empower communities to share, curate, and celebrate local heritage in the digital age. We connect people,
            places, and living traditions—supporting open collaboration so that cultural knowledge stays discoverable,
            respectful, and enduring for generations to come.
          </p>
        </div>
      </section>
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
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center', color: '#d97706' }}>
              <WarningTriangleIcon size={40} />
            </div>
            <h3 style={{ margin: '0 0 10px', color: '#333' }}>Cannot be empty</h3>
            <p style={{ color: '#666', margin: '0 0 22px', fontSize: '0.9em' }}>Please write something before posting a comment.</p>
            <button type="button" className="d-button" onClick={() => setShowEmptyModal(false)} style={{ padding: '10px 36px' }}>
              OK
            </button>
          </div>
        </div>
      )}

      {loginPrompt && (
        <div
          role="presentation"
          onClick={() => setLoginPrompt(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(2px)',
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-live="polite"
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
            <div
              style={{
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'center',
                color: loginPrompt === 'like' ? '#ff4d4f' : '#166534',
              }}
            >
              {loginPrompt === 'like' ? <HeartOutlineIcon size={40} /> : <ChatBubbleIcon size={40} />}
            </div>
            <h3 style={{ margin: '0 0 10px', color: '#333' }}>Sign in required</h3>
            <p style={{ color: '#666', margin: '0 0 22px', fontSize: '0.9em' }}>
              {loginPrompt === 'like'
                ? 'You need to be signed in to like this resource.'
                : 'You need to be signed in to post a comment.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="d-button"
                onClick={() => {
                  setLoginPrompt(null);
                  navigate('/login');
                }}
                style={{ padding: '10px 28px' }}
              >
                Log in
              </button>
              <button
                type="button"
                className="d-button"
                onClick={() => setLoginPrompt(null)}
                style={{
                  padding: '10px 28px',
                  background: '#fff',
                  color: '#333',
                  border: '1px solid #dee2e6',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ResourceDetailPage;
