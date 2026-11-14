"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { STREAM_URL } from "@/lib/station";
import { getOnAir } from "@/lib/schedule";
import { useLanguage } from "./language-context";

const PlayerContext = createContext(null);

const FALLBACK_TRACK = {
  streamTitle: "danceFM Radio",
  artist: "danceFM",
  track: "danceFM",
  album: null,
  artwork: null,
  appleUrl: null,
  live: false,
  updatedAt: null,
};

export function PlayerProvider({ children }) {
  const { t } = useLanguage();
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState(null);
  const [volume, setVolumeState] = useState(0.8);
  const [nowPlaying, setNowPlaying] = useState(FALLBACK_TRACK);
  const [history, setHistory] = useState([]);
  const [metadataStale, setMetadataStale] = useState(false);
  const nowPlayingRef = useRef(FALLBACK_TRACK);
  useEffect(() => {
    nowPlayingRef.current = nowPlaying;
  }, [nowPlaying]);

  // ---- audio ------------------------------------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;

    const onPlaying = () => {
      setPlaying(true);
      setBuffering(false);
      setError(null);
    };
    const onPause = () => setPlaying(false);
    const onWaiting = () => setBuffering(true);
    const onError = () => {
      setPlaying(false);
      setBuffering(false);
      setError(t.player.statusError);
    };

    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("stalled", onWaiting);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("stalled", onWaiting);
      audio.removeEventListener("error", onError);
    };
  }, [volume, t]);

  useEffect(() => {
    const stored = window.localStorage.getItem("dancefm-volume");
    if (stored !== null) {
      const value = Number(stored);
      if (!Number.isNaN(value)) setVolumeState(value);
    }
  }, []);

  const setVolume = useCallback((value) => {
    const clamped = Math.min(1, Math.max(0, value));
    setVolumeState(clamped);
    if (audioRef.current) audioRef.current.volume = clamped;
    window.localStorage.setItem("dancefm-volume", String(clamped));
  }, []);

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    setBuffering(true);
    setError(null);
    try {
      await audio.play();
    } catch {
      setBuffering(false);
      setPlaying(false);
      setError(t.player.statusRetry);
    }
  }, [t]);

  // ---- now playing ------------------------------------------------------
  useEffect(() => {
    let active = true;
    let timer;

    const load = async () => {
      try {
        const res = await fetch("/api/now-playing", { cache: "no-store" });
        if (!res.ok) throw new Error("metadata unavailable");
        const data = await res.json();
        if (!active) return;
        setMetadataStale(false);
        setNowPlaying({ ...FALLBACK_TRACK, ...data });
      } catch {
        if (active) setMetadataStale(true);
      } finally {
        if (active) timer = setTimeout(load, 12000);
      }
    };

    load();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  // ---- recently played (OnlineRadioBox playlist + iTunes artwork) --------
  useEffect(() => {
    let active = true;
    let timer;

    const load = async () => {
      try {
        const res = await fetch("/api/playlist", { cache: "no-store" });
        if (!res.ok) throw new Error("playlist unavailable");
        const data = await res.json();
        if (!active) return;
        const items = (data.playlist || []).map((entry, index) => ({
          ...entry,
          seenAt: entry.playedAt || Date.now() - index * 1000,
        }));
        if (items.length) {
          setHistory(items.slice(0, 80));
        } else {
          // fall back to whatever metadata is currently playing
          setHistory((items_) => (items_.length ? items_ : [nowPlayingRef.current]));
        }
      } catch {
        if (active && nowPlayingRef.current.track) {
          setHistory((items) => (items.length ? items : [nowPlayingRef.current]));
        }
      } finally {
        if (active) timer = setTimeout(load, 20000);
      }
    };

    load();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  const [playerArtwork, setPlayerArtwork] = useState(null);

  // ---- OS / browser media controls -------------------------------------
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;
    const artwork = playerArtwork
      ? [
          { src: playerArtwork, sizes: "600x600", type: "image/jpeg" },
          { src: playerArtwork, sizes: "300x300", type: "image/jpeg" },
        ]
      : [
          {
            src: `${window.location.origin}/brand/logo-square.webp`,
            sizes: "512x512",
            type: "image/webp",
          },
        ];

    try {
      session.metadata = new MediaMetadata({
        title: nowPlaying.track || "danceFM",
        artist: nowPlaying.artist || "danceFM",
        album: "danceFM",
        artwork,
      });
    } catch {
      // MediaMetadata unsupported — the site player still works
    }
  }, [playerArtwork]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;

    const safeSet = (action, handler) => {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // action not supported by this browser
      }
    };

    safeSet("play", () => {
      audioRef.current?.play().catch(() => {});
    });
    safeSet("pause", () => audioRef.current?.pause());
    safeSet("stop", () => audioRef.current?.pause());
    return () => {
      safeSet("play", null);
      safeSet("pause", null);
      safeSet("stop", null);
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }, [playing]);

  useEffect(() => {
    const syncArtwork = () => {
      const onAir = getOnAir(new Date());
      const currentShow = onAir?.show;
      const isBooth = /^danceFM BOOTH/i.test(currentShow?.title || "");
      const scheduleCover = currentShow?.cover || null;
      const boothCover = isBooth ? scheduleCover : null;
      const nextArtwork = boothCover || scheduleCover || nowPlaying.artwork || null;
      setPlayerArtwork(nextArtwork);
    };

    const handleScheduleUpdate = () => syncArtwork();
    syncArtwork();
    window.addEventListener("dancefm-schedule-updated", handleScheduleUpdate);
    const id = setInterval(syncArtwork, 15000);
    return () => {
      window.removeEventListener("dancefm-schedule-updated", handleScheduleUpdate);
      clearInterval(id);
    };
  }, [nowPlaying.artwork]);

  const value = useMemo(
    () => ({
      playing,
      buffering,
      error,
      volume,
      setVolume,
      toggle,
      nowPlaying,
      history,
      metadataStale,
      playerArtwork,
    }),
    [
      playing,
      buffering,
      error,
      volume,
      setVolume,
      toggle,
      nowPlaying,
      history,
      metadataStale,
      playerArtwork,
    ]
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} src={STREAM_URL} preload="none" />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used inside PlayerProvider");
  return context;
}
