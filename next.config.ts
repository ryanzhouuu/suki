import type { NextConfig } from "next";

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
    ],
  },
};

export default nextConfig;
