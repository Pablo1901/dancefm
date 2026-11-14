"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePlayer } from "./player-context";
import { useLanguage } from "./language-context";
import { PlayIcon, PauseIcon, ClockIcon, MenuIcon, CloseIcon } from "./icons";
import { getBerlinZoneLabel } from "@/lib/schedule";
import { LANGUAGES } from "@/lib/i18n";

function useBerlinClock(lang) {
  const [time, setTime] = useState(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Berlin",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now);
      setTime({ formatted, zone: getBerlinZoneLabel(now, lang) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lang]);

  return time;
}

function LanguageSwitch({ className = "" }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className={`lang-switch ${className}`} role="group" aria-label={t.header.language}>
      {LANGUAGES.map((item) => (
        <button
          key={item.code}
          type="button"
          className={`lang-option ${lang === item.code ? "is-active" : ""}`}
          onClick={() => setLang(item.code)}
          aria-pressed={lang === item.code}
          title={item.name}
          lang={item.code}
        >
          {item.short}
        </button>
      ))}
    </div>
  );
}

export default function SiteHeader() {
  const { playing, buffering, toggle, nowPlaying } = usePlayer();
  const { lang, t } = useLanguage();
  const clock = useBerlinClock(lang);

  const NAV = [
    { href: "#listen", label: t.nav.listen },
    { href: "#schedule", label: t.nav.schedule },
    { href: "#news", label: t.nav.news },
    { href: "#about", label: t.nav.about },
  ];
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="container header-inner">
        <Link href="#top" className="brand" aria-label="danceFM home">
          <img
            src="/brand/logo-wordmark.webp"
            alt="danceFM"
            width="196"
            height="44"
            className="brand-logo"
          />
        </Link>

        <nav className="nav-desktop" aria-label={t.nav.sections}>
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="nav-link">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <div className="clock" title={t.header.clockTitle}>
            <ClockIcon className="clock-icon" />
            <span className="clock-time" suppressHydrationWarning>
              {clock ? clock.formatted : "--:--:--"}
            </span>
            <span className="clock-zone" suppressHydrationWarning>
              {clock ? clock.zone : "CET"}
            </span>
          </div>

          <LanguageSwitch />

          <button
            type="button"
            className="header-play"
            onClick={toggle}
            aria-label={playing ? t.header.pauseStream : t.header.playStream}
          >
            <span className={`header-play-icon ${playing ? "is-playing" : ""}`}>
              {playing ? (
                <PauseIcon className="icon-sm" />
              ) : (
                <PlayIcon className="icon-sm" />
              )}
            </span>
            <span className="header-play-text">
              {buffering && !playing
                ? t.header.tuningIn
                : playing
                  ? t.header.onAir
                  : t.header.listenLive}
            </span>
            <span className="live-dot" aria-hidden="true" />
          </button>

          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? t.header.closeMenu : t.header.openMenu}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <div className={`mobile-menu ${menuOpen ? "is-open" : ""}`}>
        <div className="mobile-menu-inner">
          <p className="mobile-menu-label">{t.header.onAirNow}</p>
          <p className="mobile-menu-track">{nowPlaying.track}</p>
          <p className="mobile-menu-artist">{nowPlaying.artist}</p>
          <nav className="mobile-nav" aria-label={t.nav.sections}>
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <LanguageSwitch className="lang-switch--mobile" />
        </div>
      </div>
    </header>
  );
}
