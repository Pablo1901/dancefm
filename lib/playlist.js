import { PLAYLIST_URL } from "./station.js";
import { lookupArtwork } from "./itunes.js";
import { getNowPlaying } from "./nowPlaying.js";

const CACHE_TTL = 1000 * 30; // playlist updates every ~20s upstream
let cached = null;
let inFlight = null;

/**
 * Splits a playlist entry like "Artist - Track" or "Artist; Track".
 * The separators used by OnlineRadioBox are "-", "–", "—" and ";" between
 * artists, so ";" is treated as an artist/artist split and the first "-" as
 * the artist/title split.
 */
export function splitEntryName(name) {
  const raw = String(name || "").trim();
  if (!raw) return { artist: null, track: null };

  // "Artist / Artist2 - Title", "Artist; Artist2 - Title"
  const dash = raw.match(/^(.{1,120}?)\s+[-\u2013\u2014]\s+(.{1,160})$/);
  if (dash) {
    const artist = dash[1].trim().split(/\s*[;/]\s*/)[0].trim();
    return { artist: artist || null, track: dash[2].trim() };
  }
  return { artist: null, track: raw };
}

function normalizeEntry(entry) {
  const { artist, track } = splitEntryName(entry?.name);
  return {
    streamTitle: String(entry?.name || "").trim(),
    artist,
    track: track || String(entry?.name || "").trim(),
    playedAt: entry?.created ? entry.created * 1000 : null,
  };
}

/**
 * Fetches the recent-playlist from OnlineRadioBox and attaches Apple Music
 * artwork (via the existing iTunes lookup) to every entry.
 */
export async function getPlaylist(limit = 20) {
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return cached.value.slice(0, limit);
  }

  if (inFlight) return inFlight.then((list) => list.slice(0, limit));

  inFlight = (async () => {
    const res = await fetch(PLAYLIST_URL, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (compatible; danceFM/1.0; +https://dancefm.radio)",
      },
    });
    if (!res.ok) throw new Error(`Playlist responded ${res.status}`);

    const data = await res.json();
    const rows = Array.isArray(data?.playlist) ? data.playlist : [];

    // the first playlist row is the track currently on air — it only belongs
    // here once the next one starts, so drop the live entry
    let currentTitle = null;
    try {
      currentTitle = (await getNowPlaying())?.streamTitle?.toLowerCase() || null;
    } catch {
      currentTitle = null;
    }

    const seen = new Set();
    const entries = [];
    for (const row of rows) {
      const normalized = normalizeEntry(row);
      if (!normalized.track) continue;
      if (currentTitle && normalized.streamTitle.toLowerCase() === currentTitle) continue;
      // dedupe identical consecutive spins, keep the newest occurrence
      const key = normalized.streamTitle.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push(normalized);
      if (entries.length >= limit) break;
    }

    const withArtwork = await Promise.all(
      entries.map(async (entry) => {
        // booth/show entries are not tracks — skip the iTunes lookup for them
        const isShow = /^(danceFM\sBOOTH|.*radio\sshow)/i.test(entry.streamTitle);
        const lookup =
          !isShow && entry.artist && entry.track
            ? await lookupArtwork({ artist: entry.artist, track: entry.track })
            : null;
        return {
          ...entry,
          artwork: lookup?.artwork || null,
          appleUrl: lookup?.appleUrl || null,
        };
      })
    );

    cached = { at: Date.now(), value: withArtwork };
    return withArtwork;
  })()
    .catch(() => cached?.value ?? [])
    .finally(() => {
      inFlight = null;
    });

  return inFlight.then((list) => list.slice(0, limit));
}
