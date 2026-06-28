"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

type Props = { src: string; variant: "splash" | "card" };

export function HeroBackground({ src, variant }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isPointerFine = matchMedia("(pointer: fine)").matches;

    if (prefersReduced || !isPointerFine) return;

    const intensity = variant === "splash" ? 14 : 8;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId: number;

    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetX = ((e.clientX - cx) / cx) * -intensity;
      targetY = ((e.clientY - cy) / cy) * -intensity;
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      el.style.transform = `translate(${currentX}px, ${currentY}px)`;
      rafId = requestAnimationFrame(tick);
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
    };
  }, [variant]);

  if (!src) return null;

  return (
    <div className="hero-bg" aria-hidden>
      {/* Photo — oversized by inset to give parallax room without clipping */}
      <div ref={wrapRef} className="hero-bg__photo-wrap">
        <Image
          src={src}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Brand-tinted gradient scrim — guarantees text legibility on any photo */}
      <div className="hero-bg__scrim" />

      {/* Atmospheric overlay: slow gradient sheen + static film grain */}
      <div className="hero-bg__overlay" />
    </div>
  );
}
