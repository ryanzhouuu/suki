export function anilistSearchErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("429")) {
      return "AniList is busy. Wait a moment and try again.";
    }
    return error.message;
  }
  return "Could not reach AniList. Try again.";
}
