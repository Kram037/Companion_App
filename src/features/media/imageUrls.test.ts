import { describe, expect, it } from 'vitest';

import { extractGoogleDriveFileId, normalizeImageUrl } from './imageUrls';

const id = '1abcDEFghiJKLmnopQRSTuvwxYZ_123456';

describe('image URL helpers', () => {
  it('extracts Google Drive file ids from supported URL shapes', () => {
    expect(extractGoogleDriveFileId(`https://drive.google.com/file/d/${id}/view`)).toBe(id);
    expect(extractGoogleDriveFileId(`https://drive.google.com/open?id=${id}`)).toBe(id);
    expect(extractGoogleDriveFileId(`https://lh3.googleusercontent.com/d/${id}`)).toBe(id);
  });

  it('normalizes Google Drive images and preserves plain URLs', () => {
    expect(normalizeImageUrl(`https://drive.google.com/file/d/${id}/view`)).toBe(`https://lh3.googleusercontent.com/d/${id}=w1024`);
    expect(normalizeImageUrl(' https://example.com/avatar.png ')).toBe('https://example.com/avatar.png');
    expect(normalizeImageUrl(null)).toBeNull();
  });
});
