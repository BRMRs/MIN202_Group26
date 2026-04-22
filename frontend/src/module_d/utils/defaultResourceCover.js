import defaultCoverSrc from '../assets/default-resource-cover.png';

/** Shown when a resource has no image thumbnails (lists + detail). */
export const DEFAULT_RESOURCE_COVER = defaultCoverSrc;

export function thumbnailSrcOrDefault(fileUrl) {
  const s = fileUrl == null ? '' : String(fileUrl).trim();
  return s ? s : DEFAULT_RESOURCE_COVER;
}
