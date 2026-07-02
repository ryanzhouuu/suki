const AUTH_ERRORS: Record<string, string> = {
  auth: "Sign in failed. Please try again.",
  oauth: "Could not start Google sign in. Please try again.",
  google_secret:
    "Google sign in failed because the client secret in Supabase is invalid. In Supabase Dashboard → Authentication → Providers → Google, paste a fresh Client Secret from Google Cloud Console.",
  pkce:
    "Sign in session expired before callback. Try Google sign in again in the same browser.",
};

type AuthErrorBannerProps = {
  code?: string;
};

export function AuthErrorBanner({ code }: AuthErrorBannerProps) {
  if (!code) return null;

  const message = AUTH_ERRORS[code] ?? AUTH_ERRORS.auth;

  return (
    <p
      className="rounded-xl border border-line bg-accent-soft px-3 py-2 text-sm text-danger"
      role="alert"
    >
      {message}
    </p>
  );
}
