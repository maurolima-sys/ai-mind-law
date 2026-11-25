import { ChevronDown } from "lucide-react";
import { LOCALES, useLocale, type Locale } from "@/lib/i18n";

export function LanguageSelector() {
  const { locale, setLocale } = useLocale();
  const current = LOCALES.find((l) => l.value === locale) ?? LOCALES[0]!;

  return (
    <label className="pm-lang-selector">
      <span className="sr-only">Interface language</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.currentTarget.value as Locale)}
        aria-label="Interface language"
      >
        {LOCALES.map((l) => (
          <option key={l.value} value={l.value}>
            {l.value.toUpperCase()}
          </option>
        ))}
      </select>
      <ChevronDown size={13} aria-hidden="true" />
    </label>
  );
}
