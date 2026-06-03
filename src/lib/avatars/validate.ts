import {
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_MAX_BYTES,
  AVATAR_MIME_TO_EXT,
  type AvatarMimeType,
} from "./constants";

export function validateAvatarFile(file: {
  size: number;
  type: string;
}): string | null {
  if (file.size <= 0) {
    return "Please choose an image.";
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return "Image must be 2 MB or smaller.";
  }

  if (
    !AVATAR_ALLOWED_MIME_TYPES.includes(file.type as AvatarMimeType)
  ) {
    return "Use a JPEG, PNG, WebP, or GIF image.";
  }

  return null;
}

export function avatarObjectPath(userId: string, mimeType: string): string | null {
  if (!AVATAR_ALLOWED_MIME_TYPES.includes(mimeType as AvatarMimeType)) {
    return null;
  }

  const ext = AVATAR_MIME_TO_EXT[mimeType as AvatarMimeType];

  return `${userId}/avatar.${ext}`;
}
