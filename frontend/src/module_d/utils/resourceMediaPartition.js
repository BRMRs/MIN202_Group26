/**
 * Classify resource media for the public detail page (Module D).
 * Aligns with module B upload rules (.docx .pdf .txt .png .jpg .jpeg .mov .mp3) plus .mp4.
 */

const IMAGE_MEDIA_TYPES = new Set(['COVER', 'DETAIL']);
const ATTACHMENT_MEDIA_TYPES = new Set(['DOCUMENT', 'VIDEO', 'AUDIO']);

export function mediaTypeOf(m) {
  return String(m?.mediaType ?? m?.media_type ?? '').toUpperCase();
}

/** Last path segment, for extension checks on /api/discover/media/{id} URLs. */
export function basenameForFileType(pathOrUrl) {
  const s = String(pathOrUrl ?? '');
  const noQuery = s.split('?')[0];
  const seg = noQuery.split(/[/\\]/).filter(Boolean).pop() || '';
  return seg;
}

/** COVER/DETAIL rows: treat extension-less API URLs as images unless filename clearly names a non-image file. */
function looksLikeGalleryImageForTypedRow(pathOrUrl) {
  const seg = basenameForFileType(pathOrUrl);
  if (!seg) return true;
  const lower = seg.toLowerCase();
  if (!lower.includes('.')) return true;
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(lower)) return true;
  if (/\.(pdf|docx?|txt|mov|mp4|mp3|m4a|wav|aac|ogg|webm|zip)$/i.test(lower)) return false;
  return true;
}

/**
 * Legacy `resource.fileUrl` when media list is empty or only attachments: avoid putting a bare
 * /api/discover/media/{id} URL in the gallery when other rows exist (likely non-image blobs).
 */
function legacyFileUrlIsGalleryImage(pathOrUrl, hasStructuredMediaRows) {
  const seg = basenameForFileType(pathOrUrl);
  if (!seg) return !hasStructuredMediaRows;
  const lower = seg.toLowerCase();
  if (!lower.includes('.')) {
    return !hasStructuredMediaRows;
  }
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(lower)) return true;
  if (/\.(pdf|docx?|txt|mov|mp4|mp3|m4a|wav|aac|ogg|webm|zip)$/i.test(lower)) return false;
  return true;
}

/**
 * Human-readable kind for the attachments list (replaces raw DOCUMENT / VIDEO in the UI).
 */
export function attachmentKindLabel(m) {
  const t = mediaTypeOf(m);
  const base = basenameForFileType(m?.fileName || m?.fileUrl || '');
  const ext = base.includes('.') ? base.slice(base.lastIndexOf('.') + 1).toLowerCase() : '';
  if (t === 'VIDEO' || ext === 'mov' || ext === 'mp4' || ext === 'webm') return 'Video';
  if (t === 'AUDIO' || ext === 'mp3' || ext === 'm4a' || ext === 'wav' || ext === 'aac' || ext === 'ogg')
    return 'Audio';
  if (ext === 'pdf') return 'PDF';
  if (ext === 'doc' || ext === 'docx') return 'Document';
  if (ext === 'txt') return 'Text';
  return t ? t.charAt(0) + t.slice(1).toLowerCase() : 'File';
}

/**
 * Splits API media rows into gallery images vs downloadable / previewable attachments.
 */
export function partitionResourceDetailMedia(resource) {
  if (!resource) {
    return { imageMedia: [], attachmentMedia: [], externalLinks: [] };
  }
  const raw = Array.isArray(resource.media) ? resource.media : [];
  const images = [];
  const attachments = [];

  const pushAttachment = (row) => {
    attachments.push(row);
  };

  for (const m of raw) {
    const t = mediaTypeOf(m);
    const nameProbe = m?.fileName || m?.fileUrl || '';
    if (IMAGE_MEDIA_TYPES.has(t)) {
      if (looksLikeGalleryImageForTypedRow(nameProbe)) {
        images.push(m);
      } else {
        pushAttachment(m);
      }
    } else if (ATTACHMENT_MEDIA_TYPES.has(t)) {
      pushAttachment(m);
    } else if (t) {
      pushAttachment(m);
    } else {
      pushAttachment(m);
    }
  }

  if (images.length === 0 && resource.fileUrl) {
    const legacy = String(resource.fileUrl).trim();
    if (legacy) {
      const hasStructuredMedia = raw.length > 0;
      if (legacyFileUrlIsGalleryImage(legacy, hasStructuredMedia)) {
        images.push({
          id: 'legacy-cover',
          fileUrl: resource.fileUrl,
          fileName: null,
          mediaType: 'DETAIL',
        });
      } else {
        const alreadyListed = attachments.some(
          (a) => a.fileUrl && String(a.fileUrl).trim() === legacy,
        );
        if (!alreadyListed) {
          pushAttachment({
            id: 'legacy-file',
            fileUrl: resource.fileUrl,
            fileName: basenameForFileType(legacy) || 'file',
            mediaType: 'DOCUMENT',
          });
        }
      }
    }
  }

  const externalLinks = [];
  const rawLink = resource.externalLink;
  if (rawLink != null && typeof rawLink === 'string') {
    rawLink
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((u) => externalLinks.push(u));
  }

  return {
    imageMedia: images,
    attachmentMedia: attachments,
    externalLinks,
  };
}
