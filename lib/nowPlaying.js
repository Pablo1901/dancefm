import { METADATA_URL } from "./station.js";
import { lookupArtwork } from "./itunes.js";

const CACHE_TTL = 8000;
let cached = null;
let inFlight = null;

function splitStreamTitle(streamTitle) {
  const raw = String(streamTitle || "").trim();
  if (!raw) return { artist: null, track: null };

  // "Artist - Title" is the usual Icecast/Zeno format
  const dash = raw.match(/^(.{1,120}?)\s+[-\u2013\u2014]\s+(.{1,160})$/);
  if (dash) {
    return { artist: dash[1].trim(), track: dash[2].trim() };
  }
  return { artist: null, track: raw };
}

async function readMetadataSignal() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);

  try {
    const res = await fetch(METADATA_URL, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: "text/event-stream",
        "User-Agent": "danceFM/1.0 (+https://dancefm.radio)",
      },
    });
    if (!res.ok || !res.body) throw new Error(`Metadata responded ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const deadline = Date.now() + 5500;

    while (Date.now() < deadline) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const match = buffer.match(/data:\s*(\{.*?\})\s*(?:\n|$)/s);
      if (match) {
        try {
          const payload = JSON.parse(match[1]);
          if (payload && typeof payload.streamTitle === "string") {
            controller.abort();
            return payload.streamTitle;
          }
        } catch {
          // keep reading until a parseable event arrives
        }
      }
      if (buffer.length > 20000) break;
    }
    controller.abort();
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getNowPlaying() {
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.value;

  if (inFlight) return inFlight;

  inFlight = (async () => {
    let streamTitle = null;
    try {
      streamTitle = await readMetadataSignal();
    } catch {
      streamTitle = null;
    }

    if (!streamTitle && cached) return cached.value;

    const { artist, track } = splitStreamTitle(streamTitle);
    const fallbackTitle = streamTitle || "danceFM Radio";
    const isBoothStream = /^danceFM BOOTH/i.test(streamTitle || "") || /^danceFM BOOTH/i.test(artist || "");
    const lookup = !isBoothStream && track ? await lookupArtwork({ artist, track }) : null;

    const value = {
      streamTitle: fallbackTitle,
      artist: artist || null,
      track: track || fallbackTitle,
      album: null,
      artwork: lookup?.artwork || null,
      appleUrl: lookup?.appleUrl || null,
      live: Boolean(streamTitle),
      updatedAt: new Date().toISOString(),
    };

    cached = { at: Date.now(), value };
    return value;
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}
