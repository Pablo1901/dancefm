"use client";

import { usePlayer } from "./player-context";
import { useLanguage } from "./language-context";
import { PlayIcon, PauseIcon, RadioIcon, CalendarIcon } from "./icons";

export default function About() {
  const { playing, toggle } = usePlayer();
  const { t } = useLanguage();

  return (
    <section className="section about" id="about">
      <div className="container">
        <div className="about-panel">
          <div className="about-bg" aria-hidden="true">
            <img src="/brand/banner.webp" alt="" />
          </div>

          <div className="about-content">
            <span className="eyebrow eyebrow--plain">{t.about.eyebrow}</span>
            <h2 className="section-title">
              {t.about.titleA}
              <br />
              <span className="gradient-text">{t.about.titleB}</span>
            </h2>
            <p className="section-copy">{t.about.copy}</p>

            <ul className="about-points">
              {t.about.points.map((point) => (
                <li key={point.title}>
                  <span className="about-point-title">{point.title}</span>
                  <span className="about-point-text">{point.text}</span>
                </li>
              ))}
            </ul>

            <div className="about-actions">
              <button type="button" className="button button--primary" onClick={toggle}>
                {playing ? <PauseIcon className="icon-sm" /> : <PlayIcon className="icon-sm" />}
                {playing ? t.about.pauseStream : t.about.listen}
              </button>
              <a href="#schedule" className="button button--ghost">
                <CalendarIcon className="icon-sm" />
                {t.about.programme}
              </a>
            </div>
          </div>

          <div className="about-side">
            <div className="about-mark">
              <img
                src="/brand/logo-square.webp"
                alt={t.about.logoAlt}
                width="240"
                height="240"
              />
              <span className="about-mark-glow" aria-hidden="true" />
            </div>
            <div className="about-live">
              <span className="about-live-label">
                <RadioIcon className="icon-xs" />
                {t.about.status}
              </span>
              <span className="about-live-value">
                <span className="live-dot" aria-hidden="true" />
                {t.about.online}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
