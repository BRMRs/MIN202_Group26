/**
 * Public resource detail — media split — Module D
 * PBI 4.4: Task: "Detail page UI" (images vs files vs external links; aligns with module B file types)
 */

const IMAGE_MEDIA_TYPES = new Set(['COVER', 'DETAIL']);
const ATTACHMENT_MEDIA_TYPES = new Set(['DOCUMENT', 'VIDEO', 'AUDIO']);

export function mediaTypeOf(m) {
  return String(m?.mediaType ?? m?.media_type ?? '').toUpperCase();
}

// Filename segment for /api/discover/media/{id} extension checks
export function basenameForFileType(pathOrUrl) {
  const s = String(pathOrUrl ?? '');
  const noQuery = s.split('?')[0];
  const seg = noQuery.split(/[/\\]/).filter(Boolean).pop() || '';
  return seg;
}

// COVER/DETAIL: treat extension-less media URLs as images unless extension is clearly non-image
function looksLikeGalleryImageForTypedRow(pathOrUrl) {
  const seg = basenameForFileType(pathOrUrl);
  if (!seg) return true;
  const lower = seg.toLowerCase();
  if (!lower.includes('.')) return true;
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(lower)) return true;
  if (/\.(pdf|docx?|txt|mov|mp4|mp3|m4a|wav|aac|ogg|webm|zip)$/i.test(lower)) return false;
  return true;
}

// Legacy resource.fileUrl: keep non-images out of the gallery when structured media exists
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

// Attachment list label (document / video / audio / …)
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

// Gallery images vs attachments; external links from resource.externalLink
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
