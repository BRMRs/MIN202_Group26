import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Resource stats context — Module D
 * PBI 4.4 / 4.5: comment count, like count, and per-resource liked state (detail + list)
 */
const ResourceStatsContext = createContext(null);

export function ResourceStatsProvider({ children }) {
  const [commentCountByResourceId, setCommentCountByResourceId] = useState({});
  const [likeCountByResourceId, setLikeCountByResourceId] = useState({});
  const [userLikedByResourceId, setUserLikedByResourceId] = useState({});

  const setCommentCountForResource = useCallback((resourceId, count) => {
    const key = String(resourceId);
    const n = typeof count === 'number' && Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0;
    setCommentCountByResourceId((prev) => {
      if (prev[key] === n) return prev;
      return { ...prev, [key]: n };
    });
  }, []);

  const setLikeCountForResource = useCallback((resourceId, count) => {
    const key = String(resourceId);
    const n = typeof count === 'number' && Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0;
    setLikeCountByResourceId((prev) => {
      if (prev[key] === n) return prev;
      return { ...prev, [key]: n };
    });
  }, []);

  const seedLikeCountIfAbsent = useCallback((resourceId, count) => {
    const key = String(resourceId);
    const n = typeof count === 'number' && Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0;
    setLikeCountByResourceId((prev) => {
      if (Object.prototype.hasOwnProperty.call(prev, key)) return prev;
      return { ...prev, [key]: n };
    });
  }, []);

  const setUserLikedForResource = useCallback((resourceId, liked) => {
    const key = String(resourceId);
    const v = Boolean(liked);
    setUserLikedByResourceId((prev) => {
      if (prev[key] === v) return prev;
      return { ...prev, [key]: v };
    });
  }, []);

  const value = useMemo(
    () => ({
      commentCountByResourceId,
      setCommentCountForResource,
      likeCountByResourceId,
      setLikeCountForResource,
      seedLikeCountIfAbsent,
      userLikedByResourceId,
      setUserLikedForResource,
    }),
    [
      commentCountByResourceId,
      setCommentCountForResource,
      likeCountByResourceId,
      setLikeCountForResource,
      seedLikeCountIfAbsent,
      userLikedByResourceId,
      setUserLikedForResource,
    ],
  );

  return <ResourceStatsContext.Provider value={value}>{children}</ResourceStatsContext.Provider>;
}

export function useResourceStats() {
  const ctx = useContext(ResourceStatsContext);
  if (!ctx) {
    throw new Error('useResourceStats must be used within ResourceStatsProvider');
  }
  return ctx;
}

export function getEffectiveCommentCount(resource, commentCountByResourceId) {
  if (!resource || resource.id == null) return 0;
  const key = String(resource.id);
  if (Object.prototype.hasOwnProperty.call(commentCountByResourceId, key)) {
    return commentCountByResourceId[key];
  }
  return resource.commentCount ?? 0;
}

export function getEffectiveLikeCount(resource, likeCountByResourceId) {
  if (!resource || resource.id == null) return 0;
  const key = String(resource.id);
  if (Object.prototype.hasOwnProperty.call(likeCountByResourceId, key)) {
    return likeCountByResourceId[key];
  }
  return resource.likeCount ?? 0;
}
