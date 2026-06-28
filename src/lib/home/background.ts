import { readdirSync } from "fs";
import { join } from "path";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

export function getRandomBackground(): string {
  try {
    const dir = join(process.cwd(), "public", "backgrounds");
    const files = readdirSync(dir).filter((f) => {
      const ext = f.slice(f.lastIndexOf(".")).toLowerCase();
      return IMAGE_EXTS.has(ext);
    });
    if (files.length === 0) return "";
    const file = files[Math.floor(Math.random() * files.length)];
    return `/backgrounds/${file}`;
  } catch {
    return "";
  }
}
