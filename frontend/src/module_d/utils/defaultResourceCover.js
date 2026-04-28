import defaultCoverSrc from '../assets/default-resource-cover.png';

/** Shown when a resource has no image thumbnails (lists + detail). */
export const DEFAULT_RESOURCE_COVER = defaultCoverSrc;

const IMAGE_FILE_RE = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;
const NON_IMAGE_FILE_RE = /\.(pdf|docx?|txt|mov|mp4|mp3|m4a|wav|aac|ogg|webm|zip)$/i;
const IMAGE_MEDIA_TYPES = new Set(['COVER', 'DETAIL']);
const NON_IMAGE_MEDIA_TYPES = new Set(['DOCUMENT', 'VIDEO', 'AUDIO']);

function clean(value) {
  return value == null ? '' : String(value).trim();
}

function withoutQuery(value) {
  return clean(value).split('?')[0].split('#')[0];
}

export function isImageLikeResource(fileUrl, fileName, mediaType) {
  const type = clean(mediaType).toUpperCase();
  if (NON_IMAGE_MEDIA_TYPES.has(type)) return false;

  const url = clean(fileUrl);
  const probe = withoutQuery(fileName) || withoutQuery(fileUrl);
  if (IMAGE_FILE_RE.test(probe)) return true;
  if (NON_IMAGE_FILE_RE.test(probe)) return false;
  if (/^\/api\/discover\/media\/\d+(?:\?|$)/.test(url)) return true;

  return IMAGE_MEDIA_TYPES.has(type);
}

export function imageSrcOrDefault(fileUrl, fileName, mediaType) {
  const url = clean(fileUrl);
  if (!url) return DEFAULT_RESOURCE_COVER;
  return isImageLikeResource(url, fileName, mediaType) ? url : DEFAULT_RESOURCE_COVER;
}

export function thumbnailSrcOrDefault(fileUrl, fileName, mediaType) {
  return imageSrcOrDefault(fileUrl, fileName, mediaType);
}

export function firstImageMediaUrl(mediaFiles) {
  if (!Array.isArray(mediaFiles)) return null;

  const explicitCover = mediaFiles.find((m) =>
    clean(m?.mediaType).toUpperCase() === 'COVER' &&
    isImageLikeResource(m?.fileUrl || m?.url, m?.fileName, m?.mediaType)
  );
  if (explicitCover) return explicitCover.fileUrl || explicitCover.url;

  const firstImage = mediaFiles.find((m) =>
    isImageLikeResource(m?.fileUrl || m?.url, m?.fileName, m?.mediaType)
  );
  return firstImage ? firstImage.fileUrl || firstImage.url : null;
}
