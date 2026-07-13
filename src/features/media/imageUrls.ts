export function extractGoogleDriveFileId(url: string | null | undefined) {
  if (!url) return null;
  const trimmed = url.trim();
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]{20,})/,
    /\/(?:document|presentation|spreadsheets)\/d\/([a-zA-Z0-9_-]{20,})/,
    /[?&]id=([a-zA-Z0-9_-]{20,})/,
    /\/d\/([a-zA-Z0-9_-]{20,})(?:\b|$)/,
  ];

  return patterns.map(pattern => trimmed.match(pattern)?.[1]).find(Boolean) ?? null;
}

export function normalizeImageUrl(url: string | null | undefined) {
  if (!url) return url;
  const id = extractGoogleDriveFileId(url);
  return id ? `https://lh3.googleusercontent.com/d/${id}=w1024` : url.trim();
}
