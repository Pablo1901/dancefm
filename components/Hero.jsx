"use client";

import PlayerCard from "./PlayerCard";
import { usePlayer } from "./player-context";
import { useLanguage } from "./language-context";
import { PlayIcon, PauseIcon, CalendarIcon, WaveformIcon } from "./icons";

export default function Hero() {
  const { playing, toggle } = usePlayer();
  const { t } = useLanguage();

  return (
    <section className="hero" id="listen">
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-orb hero-orb--cyan" />
        <div className="hero-orb hero-orb--violet" />
        <div className="hero-grid-lines" />
      </div>

      <div className="container hero-inner">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="live-dot" aria-hidden="true" />
            {t.hero.eyebrow}
          </span>

          <h1 className="hero-title">
            {t.hero.titleA}
            <br />
            <span className="gradient-text">{t.hero.titleB}</span>
          </h1>

          <p className="hero-lede">{t.hero.lede}</p>

          <div className="hero-actions">
            <button type="button" className="button button--primary" onClick={toggle}>
              {playing ? <PauseIcon className="icon-sm" /> : <PlayIcon className="icon-sm" />}
              {playing ? t.hero.pauseStream : t.hero.listenLive}
            </button>
            <a href="#schedule" className="button button--ghost">
              <CalendarIcon className="icon-sm" />
              {t.hero.viewSchedule}
            </a>
          </div>

          <dl className="hero-stats">
            <div className="stat">
              <dt>{t.hero.statOnAir}</dt>
              <dd>{t.hero.statOnAirValue}</dd>
            </div>
            <div className="stat">
              <dt>{t.hero.statStream}</dt>
              <dd>{t.hero.statStreamValue}</dd>
            </div>
            <div className="stat">
              <dt>{t.hero.statSound}</dt>
              <dd>{t.hero.statSoundValue}</dd>
            </div>
          </dl>
        </div>

        <div className="hero-player">
          <span className="hero-player-tag">
            <WaveformIcon className="icon-wave" />
            {t.hero.playerTag}
          </span>
          <PlayerCard />
        </div>
      </div>
    </section>
  );
}
