import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { en, type TranslationKey, type Translations } from "./en";
import { pt } from "./pt";
import { es } from "./es";

export type Locale = "en" | "pt" | "es";

export const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "pt", label: "Português", flag: "🇵🇹" },
  { value: "es", label: "Español", flag: "🇪🇸" },
];

const dictionaries: Record<Locale, Translations> = { en, pt, es };

/** Replace {{key}} placeholders in a translation string. */
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key as string] ?? ""));
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Always start with "en" so SSR and client first render match.
  // Sync from localStorage after hydration to avoid mismatch.
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pocketmind.locale");
      if (stored === "en" || stored === "pt" || stored === "es") setLocale(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const handleSetLocale = useCallback((next: Locale) => {
    setLocale(next);
    try {
      localStorage.setItem("pocketmind.locale", next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      const dict = dictionaries[locale];
      const raw = (dict[key] ?? en[key]) as string;
      return vars ? interpolate(raw, vars) : raw;
    },
    [locale],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a <LocaleProvider />");
  return ctx;
}

/** Convenience alias — returns only the t() function. */
export function useT(): (key: TranslationKey, vars?: Record<string, string | number>) => string {
  return useLocale().t;
}
