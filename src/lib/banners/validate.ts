import {
  BANNER_ALLOWED_MIME_TYPES,
  BANNER_MAX_BYTES,
  BANNER_MIME_TO_EXT,
  type BannerMimeType,
} from "./constants";

export function validateBannerFile(file: {
  size: number;
  type: string;
}): string | null {
  if (file.size <= 0) {
    return "Please choose an image.";
  }

  if (file.size > BANNER_MAX_BYTES) {
    return "Image must be 5 MB or smaller.";
  }

  if (
    !BANNER_ALLOWED_MIME_TYPES.includes(file.type as BannerMimeType)
  ) {
    return "Use a JPEG, PNG, or WebP image.";
  }

  return null;
}

export function bannerObjectPath(
  userId: string,
  mimeType: string,
): string | null {
  if (!BANNER_ALLOWED_MIME_TYPES.includes(mimeType as BannerMimeType)) {
    return null;
  }

  const ext = BANNER_MIME_TO_EXT[mimeType as BannerMimeType];

  return `${userId}/banner.${ext}`;
}
