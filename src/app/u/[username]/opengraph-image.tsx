import { ImageResponse } from "next/og";

import { loadOgFonts } from "@/lib/og/fonts";
import { getShareCardData, type ShareCardData } from "@/lib/profiles/share-card";

export const alt = "Profile on Suki";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COLORS = {
  surface: "#fffdf8",
  surface2: "#efe7d7",
  ink: "#221d17",
  muted: "#6d6357",
  accent: "#df4a2c",
  onAccent: "#fff7f1",
  line: "#e2d8c6",
};

type ImageProps = { params: Promise<{ username: string }> };

function GenericCard() {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        background: COLORS.surface,
        color: COLORS.ink,
      }}
    >
      <div
        style={{
          fontFamily: "Fraunces",
          fontWeight: 600,
          fontSize: 96,
          color: COLORS.accent,
        }}
      >
        Suki
      </div>
      <div style={{ fontFamily: "Hanken Grotesk", fontSize: 34, color: COLORS.muted }}>
        Track anime, build your watchlist, rank your favorites.
      </div>
    </div>
  );
}

function Avatar({ card }: { card: ShareCardData }) {
  if (card.avatarUrl) {
    return (
      <img
        src={card.avatarUrl}
        alt=""
        width={132}
        height={132}
        style={{
          width: 132,
          height: 132,
          borderRadius: 132,
          objectFit: "cover",
          border: `6px solid ${COLORS.surface}`,
          boxShadow: `0 0 0 2px ${COLORS.line}`,
        }}
      />
    );
  }
  return (
    <div
      style={{
        display: "flex",
        width: 132,
        height: 132,
        borderRadius: 132,
        alignItems: "center",
        justifyContent: "center",
        background: COLORS.accent,
        color: COLORS.onAccent,
        fontFamily: "Fraunces",
        fontWeight: 600,
        fontSize: 64,
      }}
    >
      {card.displayName.charAt(0).toUpperCase()}
    </div>
  );
}

function ProfileCard({ card }: { card: ShareCardData }) {
  const covers = card.covers;
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        flexDirection: "column",
        padding: 64,
        background: COLORS.surface,
        color: COLORS.ink,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <Avatar card={card} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div
            style={{
              fontFamily: "Fraunces",
              fontWeight: 600,
              fontSize: 60,
              lineHeight: 1.05,
            }}
          >
            {card.displayName}
          </div>
          <div
            style={{
              fontFamily: "Hanken Grotesk",
              fontSize: 30,
              color: COLORS.muted,
              marginTop: 4,
            }}
          >
            {`@${card.username}`}
          </div>
        </div>
        <div
          style={{
            fontFamily: "Fraunces",
            fontWeight: 600,
            fontSize: 40,
            color: COLORS.accent,
          }}
        >
          Suki
        </div>
      </div>

      {/* Meta row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 28,
          flexWrap: "wrap",
        }}
      >
        {card.topGenres.map((genre) => (
          <div
            key={genre}
            style={{
              display: "flex",
              fontFamily: "Hanken Grotesk",
              fontWeight: 600,
              fontSize: 26,
              color: COLORS.ink,
              background: COLORS.surface2,
              borderRadius: 999,
              padding: "8px 20px",
            }}
          >
            {genre}
          </div>
        ))}
        {card.completedCount > 0 ? (
          <div
            style={{
              display: "flex",
              fontFamily: "Hanken Grotesk",
              fontSize: 26,
              color: COLORS.muted,
              padding: "8px 4px",
            }}
          >
            {card.completedCount} completed
          </div>
        ) : null}
      </div>

      {/* Covers — the lead signal */}
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "flex-end",
          gap: 18,
          marginTop: 36,
        }}
      >
        {covers.length > 0 ? (
          covers.map((cover) =>
            cover.coverUrl ? (
              <img
                key={cover.seriesId}
                src={cover.coverUrl}
                alt=""
                width={168}
                height={240}
                style={{
                  width: 168,
                  height: 240,
                  objectFit: "cover",
                  borderRadius: 14,
                  border: `1px solid ${COLORS.line}`,
                }}
              />
            ) : (
              <div
                key={cover.seriesId}
                style={{
                  display: "flex",
                  width: 168,
                  height: 240,
                  borderRadius: 14,
                  background: COLORS.surface2,
                }}
              />
            ),
          )
        ) : (
          <div
            style={{
              display: "flex",
              fontFamily: "Hanken Grotesk",
              fontSize: 28,
              color: COLORS.muted,
            }}
          >
            Ranking favorites on Suki
          </div>
        )}
      </div>
    </div>
  );
}

export default async function Image({ params }: ImageProps) {
  const { username } = await params;
  const fonts = await loadOgFonts();
  const headers = {
    "Cache-Control":
      "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
  };

  let element = <GenericCard />;
  try {
    const card = await getShareCardData(username);
    if (card?.isPublic) {
      element = <ProfileCard card={card} />;
    }
  } catch {
    // Fall back to the generic card if data/image loading fails — a single
    // broken external cover must not 500 the OG route.
    element = <GenericCard />;
  }

  return new ImageResponse(element, { ...size, fonts, headers });
}
