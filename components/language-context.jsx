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

  // Pick up a saved choice; otherwise detect via IP geo (German visitors get
  // German), falling back to browser language.
  useEffect(() => {
    let stored = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // storage blocked — fall through to geo/browser detection
    }

    if (stored === "en" || stored === "de") {
      setLangState(stored);
      return;
    }

    let active = true;

    // Instant guess from the browser locale while the geo lookup runs.
    if (typeof navigator !== "undefined" && /^de\b/i.test(navigator.language || "")) {
      setLangState("de");
    }

    fetch("/api/geo", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.language === "de") setLangState("de");
      })
      .catch(() => {});

    return () => {
      active = false;
    };
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
