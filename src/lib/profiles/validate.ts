const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "auth",
  "login",
  "signup",
  "settings",
  "search",
  "library",
  "ranking",
  "friends",
  "onboarding",
  "u",
  "anime",
]);

export function validateUsername(username: string): string | null {
  const trimmed = username.trim();
  if (!USERNAME_REGEX.test(trimmed)) {
    return "Username must be 3–30 characters: letters, numbers, and underscores only.";
  }
  if (RESERVED_USERNAMES.has(trimmed.toLowerCase())) {
    return "This username is reserved.";
  }
  return null;
}

export function normalizeUsername(username: string): string {
  return username.trim();
}
