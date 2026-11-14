"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DEFAULT_LANGUAGE, getDictionary } from "@/lib/i18n";

const LanguageContext = createContext(null);
const STORAGE_KEY = "dancefm-language";

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT_LANGUAGE);

  // Pick up a saved choice, or start in German for German browsers.
  useEffect(() => {
    let stored = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // storage blocked — fall through to browser language
    }

    if (stored === "en" || stored === "de") {
      setLangState(stored);
      return;
    }
    if (typeof navigator !== "undefined" && /^de\b/i.test(navigator.language || "")) {
      setLangState("de");
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next) => {
    const value = next === "de" ? "de" : "en";
    setLangState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // storage blocked — the choice still applies for this page view
    }
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, t: getDictionary(lang) }),
    [lang, setLang]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
