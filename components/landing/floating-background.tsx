"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { INITIAL_STATE, THEMES } from "@/lib/constants";
import { buildSignApiUrl } from "@/lib/api-url";
import { SignatureState } from "@/lib/types";

// Define a few "card" configurations for the background
const BACKGROUND_CARDS = [
  {
    theme: "pepsi",
    text: "Signature",
    rotate: "-rotate-6",
    top: "10%",
    left: "5%",
    animation: "animate-float",
    delay: "delay-0",
    scale: "scale-100",
  },
  {
    theme: "ink",
    text: "Design",
    rotate: "rotate-12",
    top: "20%",
    right: "10%",
    animation: "animate-float-reverse",
    delay: "delay-1000",
    scale: "scale-90",
  },
  {
    theme: "neon", // 'neon' isn't standard, mapping to 'laser' or 'cyber'
    text: "Creative",
    rotate: "-rotate-3",
    bottom: "15%",
    left: "15%",
    animation: "animate-float-slow",
    delay: "delay-500",
    scale: "scale-110",
  },
  {
    theme: "chinese",
    text: "艺术",
    rotate: "rotate-6",
    bottom: "25%",
    right: "5%",
    animation: "animate-float",
    delay: "delay-200",
    scale: "scale-95",
  },
];

// Helper to map generic theme names to actual keys if needed,
// though we can just use valid keys from THEMES.
const THEME_MAP: Record<string, string> = {
  neon: "cyber",
};

export function FloatingBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 select-none bg-[#fdfdfb] dark:bg-[#121212] transition-colors duration-300">
      {/* Existing Blobs (Soft Color) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[300px] bg-red-400/10 blur-[80px] -rotate-15 animate-pulse" />
      <div className="absolute top-[20%] left-[20%] w-[400px] h-[600px] bg-blue-400/10 blur-[100px] rotate-10 animate-pulse delay-700" />
      <div className="absolute top-[-5%] right-[20%] w-[600px] h-[400px] bg-yellow-400/10 blur-[90px] -rotate-6 animate-pulse delay-500" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[500px] bg-green-400/10 blur-[70px] rotate-20" />
      <div className="absolute bottom-[20%] left-[30%] w-[400px] h-[300px] bg-purple-400/10 blur-[80px] -rotate-12" />

      {/* Floating Cards */}
      {BACKGROUND_CARDS.map((card, index) => {
        const themeKey = THEME_MAP[card.theme] || card.theme;
        const themeConfig = THEMES[themeKey] || THEMES["default"];

        // Construct state for image generation
        const cardState: SignatureState = {
          ...INITIAL_STATE,
          ...themeConfig,
          text: card.text,
          bg: "transparent", // Generate transparent SVG to overlay on styled card
          bgTransparent: true,
        };

        const imgUrl = buildSignApiUrl(cardState, {
          format: "svg",
          origin: "",
        });

        // Determine card style based on theme (simplified for background)
        const cardBg =
          themeConfig.bgMode === "gradient" && themeConfig.bg && themeConfig.bg2
            ? `linear-gradient(135deg, ${themeConfig.bg} 0%, ${themeConfig.bg2} 100%)`
            : themeConfig.bg || "#ffffff";

        return (
          <div
            key={index}
            className={cn(
              "absolute p-4 rounded-xl shadow-xl border border-white/20 backdrop-blur-sm opacity-60 dark:opacity-40 transition-transform duration-1000 ease-in-out",
              card.rotate,
              card.animation,
              card.delay,
              card.scale,
            )}
            style={{
              top: card.top,
              left: card.left,
              right: card.right,
              bottom: card.bottom,
              background: cardBg,
              width: "200px",
              height: "120px",
            }}
          >
            <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
              {
                /* Use text instead of image for purely decorative purposes if image loading is heavy?
                   No, user asked for "signature cards". SVG is light enough. */
              }
              <img
                src={imgUrl}
                alt=""
                className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-screen opacity-80"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
