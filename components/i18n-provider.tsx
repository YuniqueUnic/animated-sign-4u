"use client";

import * as React from "react";
import type { ReactNode } from "react";

import type { Locale, MessageKey } from "@/lib/i18n";
import { translate } from "@/lib/i18n";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
}

const I18nContext = React.createContext<I18nContextValue | undefined>(
  undefined,
);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("en");

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem("animated-sign-locale");
      if (stored === "en" || stored === "zh") {
        setLocaleState(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem("animated-sign-locale", next);
    } catch {
      // ignore
    }
  };

  const value: I18nContextValue = React.useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: MessageKey) => translate(locale, key),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
