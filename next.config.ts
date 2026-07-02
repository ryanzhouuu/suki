import type { NextConfig } from "next";

import { buildSecurityHeaders } from "./src/lib/security/headers";

const supabaseHostname = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return "*.supabase.co";
  }
})();

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default Server Action limit is 1 MB. Avatars allow ~3 MB; MyAnimeList
      // XML import uploads (large lists) can be larger, so allow up to 6 MB.
      bodySizeLimit: "6mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "img1.ak.crunchyroll.com" },
      // Supabase Storage public URLs (avatars/banners): <project-ref>.supabase.co
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: buildSecurityHeaders({
          isDev: process.env.NODE_ENV === "development",
          supabaseHostname,
        }),
      },
    ];
  },
};

export default nextConfig;
