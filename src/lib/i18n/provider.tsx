"use client";

import { createContext, useContext, useState } from "react";
import ko from "./ko";
import en from "./en";
import th from "./th";
import es from "./es";

const translations = { ko, en, th, es } as const;
export type Lang = keyof typeof translations;

type I18nContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

export const I18nContext = createContext<I18nContextType>({
  lang: "ko",
  setLang: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("lang") as Lang) || "ko";
    }
    return "ko";
  });

  const t = (key: string): string => {
    const keys = key.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any = translations[lang];
    for (const k of keys) result = result?.[k];
    return typeof result === "string" ? result : key;
  };

  const changeLang = (l: Lang) => {
    setLang(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };

  return (
    <I18nContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);

export const LANG_FLAGS: Record<Lang, string> = {
  ko: "🇰🇷",
  en: "🇺🇸",
  th: "🇹🇭",
  es: "🇪🇸",
};
