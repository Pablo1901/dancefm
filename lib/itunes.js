const ITUNES_SEARCH = "https://itunes.apple.com/search";

const cache = new Map();
const TTL = 1000 * 60 * 60 * 6; // artwork for a track does not change

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .replace(
      /\b(feat|ft|featuring|remix|remixed|edit|mix|radio|original|extended|version|prod|live)\b/g,
      " "
    )
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreResult(result, artist, track) {
  const a = normalize(artist);
  const t = normalize(track);
  const ra = normalize(result.artistName);
  const rt = normalize(result.trackName);

  let artistScore = 0;
  if (a && (ra.includes(a) || (a.includes(ra) && ra.length > 2))) artistScore = 3;

  let trackScore = 0;
  if (t && rt === t) trackScore = 6;
  else if (t && t.length > 3 && rt.includes(t)) trackScore = 5;
  else if (t && t.length > 3 && t.includes(rt) && rt.length > 3) trackScore = 4;

  // The track name has to match — an artist-only match shows the wrong song.
  return { artistScore, trackScore, total: artistScore + trackScore };
}

function upscaleArtwork(url) {
  if (!url) return null;
  return url.replace(/\/\d+x\d+(bb)?\.(jpg|png)/, "/600x600bb.jpg");
}

async function search(term, signal) {
  const url = `${ITUNES_SEARCH}?term=${encodeURIComponent(
    term
  )}&entity=song&limit=8&country=de`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`iTunes responded ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.results) ? data.results : [];
}

/**
 * Looks up Apple Music artwork for a stream title like "Artist - Track".
 * Returns null when nothing reasonable is found (the UI draws its own cover).
 */
export async function lookupArtwork({ artist, track }) {
  const key = `${normalize(artist)}::${normalize(track)}`;
  if (!track) return null;

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  let value = null;
  try {
    const terms = artist ? [`${artist} ${track}`, track] : [track];
    for (const term of terms) {
      const results = await search(term, controller.signal);
      let best = null;
      let bestScore = 0;
      for (const result of results) {
        if (!result.artworkUrl100) continue;
        const score = scoreResult(result, artist, track);
        if (score.trackScore >= 4 && score.total > bestScore) {
          best = result;
          bestScore = score.total;
        }
      }
      if (best) {
        value = {
          artwork: upscaleArtwork(best.artworkUrl100),
          appleUrl: best.trackViewUrl || null,
          matched: true,
        };
        break;
      }
    }
  } catch {
    value = null;
  } finally {
    clearTimeout(timeout);
  }

  cache.set(key, { value, at: Date.now() });
  return value;
}
