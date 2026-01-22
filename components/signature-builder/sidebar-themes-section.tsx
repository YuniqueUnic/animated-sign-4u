import React from "react";
import { SignatureState } from "@/lib/types";
import { DEFAULT_CHAR_COLORS, INITIAL_STATE, THEMES } from "@/lib/constants";
import { ChevronDown, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

interface ThemesSectionProps {
  state: SignatureState;
  updateState: (updates: Partial<SignatureState>) => void;
  variant?: "accordion" | "flat" | "compact";
}

export function ThemesSection({ state, updateState, variant = "accordion" }: ThemesSectionProps) {
  const { t } = useI18n();

  const themeLabelKeyMap: Record<string, string> = {
    default: "themeNameDefault",
    school: "themeNameSchool",
    blueprint: "themeNameBlueprint",
    chinese: "themeNameChinese",
    cyber: "themeNameCyber",
    pepsi: "themeNamePepsi",
    coke: "themeNameCoke",
    sprite: "themeNameSprite",
    ink: "themeNameInk",
    jade: "themeNameJade",
    laser: "themeNameLaser",
    rainbow: "themeNameRainbow",
    practice: "themeNamePractice",
  };
  const applyTheme = (themeName: string) => {
    const theme = THEMES[themeName];
    if (!theme) return;

    // Start from a clean visual baseline so that previous Style & Color
    // tweaks (card padding, textures, transparency, etc.) do not leak
    // into the new theme.
    const base: SignatureState = {
      ...(INITIAL_STATE as SignatureState),
      // Preserve user content and core drawing metrics.
      text: state.text,
      fontSize: state.fontSize,
      speed: state.speed,
    };

    const next: SignatureState = {
      ...base,
      ...theme,
      // reset per-char colors; theme-level generators will re-populate
      charColors: [],
      strokeCharColors: [],
      strokeMode: theme.strokeMode ?? "single",
      // reset background sizing so themes always start from auto card size
      bgSizeMode: "auto",
      bgWidth: null,
      bgHeight: null,
    };

    // Use theme-level generators for multi modes when provided.
    if (theme.charColorsFn && theme.fillMode === "multi") {
      next.charColors = theme.charColorsFn(state.text);
    }

    if (theme.strokeCharColorsFn && theme.strokeMode === "multi") {
      next.strokeCharColors = theme.strokeCharColorsFn(state.text);
    } else if (
      !theme.strokeCharColorsFn && theme.charColorsFn &&
      theme.strokeMode === "multi"
    ) {
      // If stroke is multi but only a fill pattern is defined, reuse it.
      next.strokeCharColors = theme.charColorsFn(state.text);
    }

    updateState(next);
  };

  const gridContent = (
    <div 
      className={cn(
        variant === "accordion" ? "mt-2 grid grid-cols-4 gap-1.5" : 
        variant === "compact" ? "flex overflow-x-auto gap-2 pb-2 scrollbar-hide snap-x" :
        "grid grid-cols-4 gap-2"
      )}
    >
      {Object.keys(THEMES).map((themeKey) => {
        const theme = THEMES[themeKey];
        const isActive = state.bg === theme.bg &&
          state.stroke === theme.stroke &&
          state.font === theme.font;

        const isDark = theme.bg === "#000000" ||
          theme.bg === "#0f172a" ||
          theme.bg === "#1e3a8a" || theme.bg === "#004b93" ||
          theme.bg === "#008b47" || theme.bg === "#dc2626" ||
          theme.bg === "#f40009";

        let cardBackground: string | undefined = theme.bg;
        if (themeKey === "rainbow") {
          const stops = DEFAULT_CHAR_COLORS.map((c, i) => {
            const pct = (i /
              Math.max(
                DEFAULT_CHAR_COLORS.length - 1,
                1,
              )) *
              100;
            return `${c} ${pct}%`;
          }).join(", ");
          cardBackground = `linear-gradient(90deg, ${stops})`;
        } else if (
          (themeKey === "laser" || themeKey === "cyber") &&
          theme.fillMode === "gradient" && theme.fill1 &&
          theme.fill2
        ) {
          // For laser & cyber, emphasize fill gradient colors in preview chip
          cardBackground =
            `linear-gradient(135deg, ${theme.fill1} 0%, ${theme.fill2} 100%)`;
        } else if (
          theme.bgMode === "gradient" && theme.bg && theme.bg2
        ) {
          // Prefer background gradient when configured
          cardBackground =
            `linear-gradient(135deg, ${theme.bg} 0%, ${theme.bg2} 100%)`;
        } else if (
          theme.fillMode === "gradient" && theme.fill1 &&
          theme.fill2
        ) {
          // Fallback to fill gradient when no bg gradient
          cardBackground =
            `linear-gradient(135deg, ${theme.fill1} 0%, ${theme.fill2} 100%)`;
        } else if (theme.fill2) {
          // Single-fill themes with secondary color: blend bg and accent
          cardBackground =
            `linear-gradient(135deg, ${theme.bg} 0%, ${theme.fill2} 100%)`;
        }

        return (
          <button
            key={themeKey}
            onClick={() => applyTheme(themeKey)}
            className={cn(
              "rounded-lg border-2 transition-all flex items-end justify-center pb-1 relative overflow-hidden group shrink-0 snap-start",
              variant === "accordion" ? "h-14" : 
              variant === "compact" ? "w-12 h-12 border-gray-200 hover:border-[#1a1a1a] dark:border-gray-800 dark:hover:border-white" : 
              "aspect-square",
              isActive
                ? "ring-2 ring-indigo-500 ring-offset-2 border-transparent shadow-lg scale-105 z-10"
                : "hover:border-indigo-300 hover:shadow-md hover:scale-102",
              (variant === "flat" || variant === "compact") && isActive && "border-[#1a1a1a] dark:border-white ring-0 shadow-sm"
            )}
            style={{
              background: cardBackground,
            }}
            title={t((themeLabelKeyMap[themeKey] as any) || "themeNameDefault")}
          >
            {/* Texture overlays */}
            {theme.texture === "grid" && (
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    `linear-gradient(${theme.texColor} 1px, transparent 1px), linear-gradient(90deg, ${theme.texColor} 1px, transparent 1px)`,
                  backgroundSize: "10px 10px",
                }}
              />
            )}
            {theme.texture === "lines" && (
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    `linear-gradient(${theme.texColor} 1px, transparent 1px)`,
                  backgroundSize: "10px 10px",
                }}
              />
            )}
            {theme.texture === "dots" && (
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    `radial-gradient(${theme.texColor} 1px, transparent 1px)`,
                  backgroundSize: "6px 6px",
                }}
              />
            )}
            {theme.texture === "cross" && (
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    `linear-gradient(45deg, ${theme.texColor} 1px, transparent 1px), linear-gradient(-45deg, ${theme.texColor} 1px, transparent 1px)`,
                  backgroundSize: "10px 10px",
                }}
              />
            )}
            {theme.texture === "tianzige" && (
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    `linear-gradient(${theme.texColor} 1px, transparent 1px), linear-gradient(90deg, ${theme.texColor} 1px, transparent 1px)`,
                  backgroundSize: "16px 16px",
                }}
              />
            )}
            {theme.texture === "mizige" && (
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    `linear-gradient(${theme.texColor} 1px, transparent 1px), linear-gradient(90deg, ${theme.texColor} 1px, transparent 1px), linear-gradient(45deg, ${theme.texColor} 1px, transparent 1px), linear-gradient(-45deg, ${theme.texColor} 1px, transparent 1px)`,
                  backgroundSize: "16px 16px",
                }}
              />
            )}

            {/* Theme name with better contrast */}
            {variant === "accordion" && (
              <span
                className="text-[10px] font-bold capitalize relative z-10 px-2 py-0.5 rounded-t backdrop-blur-sm"
                style={{
                  color: isDark ? "#ffffff" : "#1f2937",
                  backgroundColor: isDark
                    ? "rgba(0,0,0,0.3)"
                    : "rgba(255,255,255,0.7)",
                }}
              >
                {t(
                  (themeLabelKeyMap[themeKey] as any) ||
                    "themeNameDefault",
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  if (variant === "flat" || variant === "compact") {
    return <section className="space-y-4">{gridContent}</section>;
  }

  return (
    <section className="space-y-4">
      <details open className="group">
        <summary className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 cursor-pointer">
          <span className="w-6 h-6 rounded bg-amber-100 text-amber-600 flex items-center justify-center">
            <Wand2 className="w-3 h-3" />
          </span>
          <span>{t("quickThemesSectionTitle")}</span>
          <ChevronDown className="ml-auto w-3 h-3 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
        </summary>
        {gridContent}
      </details>
    </section>
  );
}
