/**
 * Escape PostgREST `ilike` pattern metacharacters (`%`, `_`, `\`) so a
 * user-supplied value matches literally instead of as a wildcard. Use when
 * interpolating untrusted input into an `ilike` filter — e.g. a search term, or
 * a case-insensitive exact lookup where the value may contain `%`/`_`.
 */
export function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}
