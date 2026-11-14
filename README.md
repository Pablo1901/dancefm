# danceFM

Dark, single-page site for the danceFM radio station — live player, weekly
programme and DJ Mag news, built with Next.js (App Router).

```bash
npm install
npm run dev   # http://localhost:3003
npm run build && npm start
```

## What is wired up

| Section | Source |
| --- | --- |
| Player | `https://stream.zeno.fm/0zhyhlxidqavv` |
| Now playing | `https://api.zeno.fm/mounts/metadata/subscribe/0zhyhlxidqavv` (SSE read server-side) |
| Artwork + track names | iTunes Search API, matched against `Artist - Title` metadata |
| News | `https://djmag.com/rss` (parsed server-side, revalidated every 10 min) |
| Clock / schedule | `Europe/Berlin`, so CET/CEST switch automatically |

`/api/now-playing` proxies the Zeno metadata and enriches it with Apple Music
artwork. Server-side proxies are required for both feeds because neither sends
CORS headers. Covers are only used when the track name actually matches, so a
radio-show title never shows an unrelated album cover — the branded tile is
used instead.

Logos live in `public/brand/` (downloaded, not hot-linked):
`logo-wordmark.webp`, `logo-square.webp`, `banner.webp`.

## Languages (EN / DE)

All copy lives in `lib/i18n.js` (`en` and `de` dictionaries).
`components/language-context.jsx` holds the current language, remembers the
choice in `localStorage` (`dancefm-language`), starts in German for German
browsers, and keeps `<html lang>` in sync. The header carries an EN/DE switch
(in the mobile menu on small screens). To add a language, add a dictionary and
an entry in `LANGUAGES`.

Show text can be translated too — `genre`, `description` and `host` accept
either a plain string or `{ en: "…", de: "…" }`. Times and dates are formatted
with the matching locale, and the zone label switches between CET/CEST and
MEZ/MESZ.

## Adding shows

`lib/schedule.js` holds the whole programme. Every day currently runs
`danceFM NON STOP` from 12:00 to 12:00 (a full 24 hours — equal start and end
means all day). Add or replace entries in the matching day array:

```js
export const schedule = {
  mon: [],
  fri: [
    {
      id: "friday-night-sessions",
      title: "Friday Night Sessions",
      host: "Mara Klein",
      start: "22:00",
      end: "00:00",
      cover: "/shows/friday-night-sessions.jpg",
      genre: "House",
      description: "Four to the floor until midnight.",
    },
  ],
  // …
};
```

Start/end are Berlin times in 24h format and may cross midnight (`22:00` →
`02:00`). The schedule section, the “On air now” box, and the live chip in the
header pick the current show up automatically and refresh every 30 seconds.
Cover images belong in `public/shows/`; without one, the danceFM tile is used.

## Customising

- Copy and translations: `lib/i18n.js`
- Layout/metadata: `app/page.jsx`, `components/*`, `app/layout.jsx`
- Fonts are self-hosted in `app/fonts/` (loaded with `next/font/local`)
- Colours, type and layout: `app/globals.css` (design tokens at the top)
- Station/stream constants: `lib/station.js`
