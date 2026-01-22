"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Github, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import { INITIAL_STATE, THEMES } from "@/lib/constants";
import { buildSignApiUrl } from "@/lib/api-url";
import { SignatureState } from "@/lib/types";

export interface AppTopBarProps {
  /** Extra action buttons inserted before locale/theme/github. */
  extraActions?: React.ReactNode;
}

export function AppTopBar({ extraActions }: AppTopBarProps) {
  const { theme, setTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();
  const [logoThemeKey, setLogoThemeKey] = useState<string | null>(null);

  useEffect(() => {
    // Randomize logo theme only on the client after mount to avoid
    // SSR/client hydration mismatches caused by Math.random and
    // environment-specific origins.
    const keys = Object.keys(THEMES);
    if (keys.length === 0) return;
    setLogoThemeKey(keys[Math.floor(Math.random() * keys.length)]);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleLocale = () => {
    setLocale(locale === "en" ? "zh" : "en");
  };

  return (
    <header className="h-14 border-b bg-card backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20 shadow-xs">
      <div className="flex items-center gap-3">
        {(() => {
          // During SSR and the very first client render, render a simple
          // static 4U block to keep server and client markup identical.
          if (!logoThemeKey) {
            return (
              <div className="w-8 h-8 bg-linear-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs transform -rotate-3">
                4U
              </div>
            );
          }
          const themeConfig = THEMES[logoThemeKey];
          let logoState: SignatureState = {
            ...INITIAL_STATE,
            text: "4U",
          };
          if (themeConfig) {
            logoState = {
              ...logoState,
              ...themeConfig,
              text: "4U",
              fontSize: 100,
              bgSizeMode: "auto",
              bgWidth: null,
              bgHeight: null,
            };
          }
          // Use a relative URL to avoid SSR/CSR origin mismatches.
          const logoUrl = buildSignApiUrl(logoState, {
            format: "svg",
            origin: "",
          });

          return (
            <div className="w-8 h-8 rounded-lg overflow-hidden transform -rotate-3 shadow-none flex items-center justify-center">
              <img
                src={logoUrl}
                alt="4U logo"
                className="w-full h-full object-contain"
                loading="lazy"
                style={{
                  boxShadow: "none",
                  border: "none",
                  background: "none",
                }}
              />
            </div>
          );
        })()}
        <h1 className="text-sm font-bold tracking-tight hidden md:block">
          {t("appTitle")}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {extraActions}

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLocale}
          className="h-8 text-xs px-2 inline-flex"
        >
          {locale === "en" ? "EN" : "中文"}
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          className="h-8 w-8 text-xs inline-flex"
          aria-label={t("themeToggleLabel")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <Button
          asChild
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8 text-xs inline-flex"
        >
          <a
            href="https://github.com/YuniqueUnic/animated-sign-4u"
            target="_blank"
            rel="noreferrer"
            aria-label={t("githubRepoLabel")}
          >
            <Github className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </header>
  );
}
