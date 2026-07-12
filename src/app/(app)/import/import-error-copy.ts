/** Safe copy for persisted import failures. Legacy rows contain free-form text. */
export function importFailureMessage(code: string | null): string {
  switch (code) {
    case "source_unavailable":
      return "The source list could not be reached. Please try again.";
    case "invalid_source":
      return "The source list could not be read. Check the file or username and try again.";
    case "too_many_rows":
      return "That list is too large to import.";
    default:
      return "The import could not be completed. Please try again.";
  }
}
