"use client";

import { useEffect, useState } from "react";
import { usePlayer } from "./player-context";
import { useLanguage } from "./language-context";
import { PlayIcon, PauseIcon, VolumeIcon } from "./icons";

export default function MiniPlayer() {
  const { playing, buffering, toggle, nowPlaying, volume, setVolume, playerArtwork } = usePlayer();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.querySelector(".player-card");
    if (!target || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0, rootMargin: "-72px 0px 0px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("has-mini-player", visible);
    return () => document.body.classList.remove("has-mini-player");
  }, [visible]);

  return (
    <div className={`mini-player ${visible ? "is-visible" : ""}`} aria-hidden={!visible}>
      <div className="container mini-inner">
        <button
          type="button"
          className="mini-cover-button"
          onClick={toggle}
          tabIndex={visible ? 0 : -1}
          aria-label={playing ? t.player.pauseStream : t.player.playStream}
        >
          <img
            src={playerArtwork || "/brand/logo-square.webp"}
            alt=""
            className="mini-cover"
            width="44"
            height="44"
          />
          <span className="mini-cover-icon" aria-hidden="true">
            {playing ? <PauseIcon /> : <PlayIcon />}
          </span>
        </button>

        <div className="mini-meta">
          <span className="mini-track" title={nowPlaying.track}>
            {nowPlaying.track}
          </span>
          <span className="mini-artist" title={nowPlaying.artist}>
            {nowPlaying.artist}
          </span>
          <span className="mini-genres">{t.player.genres}</span>
        </div>

        <span className="mini-live">
          <span className="live-dot" aria-hidden="true" />
          {t.schedule.live}
        </span>

        <div className="mini-controls">
          <div className="volume-control mini-volume">
            <VolumeIcon className="icon-xs volume-icon" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="volume-slider"
              aria-label={t.player.volume}
              tabIndex={visible ? 0 : -1}
              style={{ "--value": `${volume * 100}%` }}
            />
          </div>

          <button
            type="button"
            className="mini-play"
            onClick={toggle}
            tabIndex={visible ? 0 : -1}
            aria-label={playing ? t.player.pauseStream : t.player.playStream}
          >
            {playing ? <PauseIcon className="icon-sm" /> : <PlayIcon className="icon-sm" />}
          </button>
        </div>
      </div>
    </div>
  );
}
