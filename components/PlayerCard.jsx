"use client";

import { useEffect, useMemo, useState } from "react";
import { usePlayer } from "./player-context";
import { useLanguage } from "./language-context";
import { getBerlinZoneLabel, getOnAir } from "@/lib/schedule";
import { fill } from "@/lib/i18n";
import { PlayIcon, PauseIcon, VolumeIcon, RadioIcon } from "./icons";

const EQ_BARS = [0.5, 0.85, 0.35, 0.95, 0.6, 0.75, 0.45, 0.9, 0.55];

/** Berlin-hour buckets over the last 12 hours, newest first. */
function groupByHour(items) {
  const now = Date.now();
  const cutoff = now - 12 * 3600000;
  const groups = [];
  const byKey = new Map();
  for (const item of items) {
    if (!item.playedAt || item.playedAt < cutoff) continue;
    const date = new Date(item.playedAt);
    // Berlin time, so the hour headers match the site's schedule clock
    const hourLabel = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
    const dayLabel = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin",
      day: "numeric",
      month: "short",
    }).format(date);
    const key = `${dayLabel} ${hourLabel.slice(0, 2)}`;
    if (!byKey.has(key)) {
      const group = { key, dayLabel, hourLabel, items: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    byKey.get(key).items.push(item);
  }
  return groups;
}

/** "12 min ago" / "2 h ago" style label from a playlist timestamp. */
function formatPlayedAt(playedAt) {
  if (!playedAt) return null;
  const minutes = Math.max(1, Math.round((Date.now() - playedAt) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ago`;
}

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
  const [selectedHour, setSelectedHour] = useState(null);

  const hourGroups = useMemo(() => groupByHour(history.slice(0, 200)), [history]);

  // keep a sensible hour selected as new data arrives
  useEffect(() => {
    if (hourGroups.length && !hourGroups.some((g) => g.key === selectedHour)) {
      setSelectedHour(hourGroups[0].key);
    }
  }, [hourGroups, selectedHour]);

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
        <div className="recently-hours">
          {hourGroups.map((group) => (
            <button
              key={group.key}
              type="button"
              className={`recently-hour-btn ${selectedHour === group.key ? "is-active" : ""}`}
              onClick={() => setSelectedHour(group.key)}
            >
              <span className="recently-hour-time">{group.hourLabel.slice(0, 2)}:00</span>
              <span className="recently-hour-count">{group.items.length}</span>
            </button>
          ))}
        </div>
        <div className="recently-list">
          {history.length === 0 ? (
            <span className="recently-empty">{t.player.recentEmpty}</span>
          ) : (
            (hourGroups.find((g) => g.key === selectedHour)?.items ?? []).map((item) => (
              <div className="recently-item" key={`${item.streamTitle}-${item.playedAt}`}>
                <img
                  src={item.artwork || "/brand/logo-square.webp"}
                  alt=""
                  className="recently-cover"
                  width="44"
                  height="44"
                />
                <span className="recently-text">
                  <span className="recently-track">{item.track}</span>
                  <span className="recently-artist">{item.artist}</span>
                  <span className="recently-time">{formatPlayedAt(item.playedAt)}</span>
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
