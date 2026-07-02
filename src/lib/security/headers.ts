export function buildSecurityHeaders(options: {
  isDev: boolean;
  supabaseHostname: string;
}): Array<{ key: string; value: string }> {
  const { isDev, supabaseHostname } = options;
  const csp = [
    "default-src 'self'",
    // Next.js App Router requires inline scripts without a nonce setup; dev needs eval.
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://${supabaseHostname} https://s4.anilist.co https://img1.ak.crunchyroll.com https://img.youtube.com https://i.ytimg.com`,
    "font-src 'self' data:",
    `connect-src 'self' https://${supabaseHostname} https://va.vercel-scripts.com https://vitals.vercel-insights.com`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  ];
}
