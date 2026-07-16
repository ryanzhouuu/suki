import type { NextConfig } from "next";

import { buildSecurityHeaders } from "./src/lib/security/headers";
import {
  parseSupabaseOrigin,
  type SupabaseOrigin,
} from "./src/lib/security/supabase-origin";

const supabaseOrigin: SupabaseOrigin = (() => {
  try {
    return parseSupabaseOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  } catch {
    return { protocol: "https", hostname: "*.supabase.co", port: "" };
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
      // Supabase Storage public URLs (restricted to this project's storage)
      {
        protocol: supabaseOrigin.protocol,
        hostname: supabaseOrigin.hostname,
        port: supabaseOrigin.port,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: buildSecurityHeaders({
          isDev: process.env.NODE_ENV === "development",
          supabaseOrigin,
        }),
      },
    ];
  },
};

export default nextConfig;
