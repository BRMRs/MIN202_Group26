import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * 详情页与列表共享：评论条数、点赞数、当前会话内用户是否已点赞（演示用，刷新后清空）。
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

  /** 首次进入详情时写入接口/Mock 的点赞基线；若本会话已点过赞则保留，避免重新拉详情把数字打回 */
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

  return (
    <ResourceStatsContext.Provider value={value}>
      {children}
    </ResourceStatsContext.Provider>
  );
}

export function useResourceStats() {
  const ctx = useContext(ResourceStatsContext);
  if (!ctx) {
    throw new Error('useResourceStats must be used within ResourceStatsProvider');
  }
  return ctx;
}

/** 列表卡片：有共享覆盖用覆盖，否则用接口 / Mock 字段 */
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
