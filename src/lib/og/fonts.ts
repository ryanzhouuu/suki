import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600;
  style: "normal";
};

const FONT_DIR = join(process.cwd(), "src/lib/og/fonts");

const FONT_FILES: { file: string; name: string; weight: 400 | 600 }[] = [
  { file: "Fraunces-SemiBold.ttf", name: "Fraunces", weight: 600 },
  { file: "HankenGrotesk-Regular.ttf", name: "Hanken Grotesk", weight: 400 },
  { file: "HankenGrotesk-SemiBold.ttf", name: "Hanken Grotesk", weight: 600 },
];

let cached: Promise<OgFont[]> | null = null;

/**
 * Loads the vendored TTF fonts for `ImageResponse` as ArrayBuffers. Memoized in
 * module scope so repeated OG renders reuse the same buffers.
 */
export function loadOgFonts(): Promise<OgFont[]> {
  if (!cached) {
    cached = Promise.all(
      FONT_FILES.map(async ({ file, name, weight }) => {
        const buffer = await readFile(join(FONT_DIR, file));
        const data = buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength,
        ) as ArrayBuffer;
        return { name, data, weight, style: "normal" as const };
      }),
    );
  }
  return cached;
}
