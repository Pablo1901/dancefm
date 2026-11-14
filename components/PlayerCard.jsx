"use client";

import { useEffect, useState } from "react";
import { usePlayer } from "./player-context";
import { useLanguage } from "./language-context";
import { getBerlinZoneLabel, getOnAir } from "@/lib/schedule";
import { fill } from "@/lib/i18n";
import { PlayIcon, PauseIcon, VolumeIcon, RadioIcon } from "./icons";

const EQ_BARS = [0.5, 0.85, 0.35, 0.95, 0.6, 0.75, 0.45, 0.9, 0.55];

export default function PlayerCard() {
  const {
    playing,
    buffering,
    error,
    toggle,
    volume,
    setVolume,
    nowPlaying,
    history,
    metadataStale,
    playerArtwork,
  } = usePlayer();
  const { lang, t } = useLanguage();

  const cover = playerArtwork || "/brand/logo-square.webp";
  const hasArtwork = Boolean(playerArtwork);
  const [onAir, setOnAir] = useState(null);
  const [zone, setZone] = useState("CET");

  useEffect(() => {
    const sync = () => {
      const now = new Date();
      setOnAir(getOnAir(now));
      setZone(getBerlinZoneLabel(now, lang));
    };
    sync();
    const id = setInterval(sync, 30000);
    return () => clearInterval(id);
  }, [lang]);

  return (
    <div className="player-stack">
      <article className={`player-card ${playing ? "is-playing" : ""}`}>
        <div className="player-top">
          <span className="onair-pill">
            <span className="live-dot" aria-hidden="true" />
            {t.player.onAir}
          </span>
          <span className="player-source">
            <RadioIcon className="icon-xs" />
            {metadataStale ? t.player.reconnecting : t.player.liveStream}
          </span>
        </div>

        <div className="player-main">
          <div className={`cover-frame ${hasArtwork ? "" : "is-fallback"}`}>
            <img
              src={cover}
              alt={
                hasArtwork
                  ? fill(t.player.artworkAlt, { track: nowPlaying.track })
                  : "danceFM"
              }
              className="cover-art"
              width="220"
              height="220"
            />
            <div className="cover-overlay" aria-hidden="true">
              <div className="eq" data-active={playing || buffering}>
                {EQ_BARS.map((height, index) => (
                  <span
                    key={index}
                    className="eq-bar"
                    style={{ "--h": height, "--d": `${index * 0.12}s` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="player-meta">
            {onAir ? (
              <p className="player-show">
                <RadioIcon className="icon-xs" />
                <span className="player-show-name">{onAir.show.title}</span>
                <span className="player-show-time">
                  {onAir.show.start}–{onAir.show.end} {zone}
                </span>
              </p>
            ) : null}
            <p className="player-kicker">{t.player.nowPlaying}</p>
            <h2 className="player-track" title={nowPlaying.track}>
              {nowPlaying.track}
            </h2>
            <p className="player-artist">{nowPlaying.artist}</p>
            {nowPlaying.album ? (
              <p className="player-album" title={nowPlaying.album}>
                {nowPlaying.album}
              </p>
            ) : null}
          </div>
        </div>

        <div className="player-controls">
          <button
            type="button"
            className="play-button"
            onClick={toggle}
            aria-label={playing ? t.player.pauseStream : t.player.playStream}
          >
            {playing ? <PauseIcon className="icon-play" /> : <PlayIcon className="icon-play" />}
            <span className="play-ring" aria-hidden="true" />
          </button>

          <div className="volume-control">
            <VolumeIcon className="icon-sm volume-icon" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="volume-slider"
              aria-label={t.player.volume}
              style={{ "--value": `${volume * 100}%` }}
            />
          </div>

        </div>

        <div className="player-status">
          <span className={`status-label ${error ? "is-error" : ""}`}>
            {error
              ? error
              : buffering && !playing
                ? t.player.statusBuffering
                : playing
                  ? t.player.statusLive
                  : t.player.statusIdle}
          </span>

        </div>
      </article>

      <div className="recently">
        <span className="recently-label">{t.player.recentlyPlayed}</span>
        <div className="recently-list">
          {history.length === 0 ? (
            <span className="recently-empty">{t.player.recentEmpty}</span>
          ) : (
            history.slice(0, 3).map((item) => (
              <div className="recently-item" key={`${item.streamTitle}-${item.seenAt}`}>
                <img
                  src={item.artwork || "/brand/logo-square.webp"}
                  alt=""
                  className="recently-cover"
                  width="40"
                  height="40"
                />
                <span className="recently-text">
                  <span className="recently-track">{item.track}</span>
                  <span className="recently-artist">{item.artist}</span>
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
