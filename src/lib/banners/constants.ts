export const BANNER_BUCKET = "banners";

export const BANNER_MAX_BYTES = 5 * 1024 * 1024;

export const BANNER_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type BannerMimeType = (typeof BANNER_ALLOWED_MIME_TYPES)[number];

export const BANNER_MIME_TO_EXT: Record<BannerMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
