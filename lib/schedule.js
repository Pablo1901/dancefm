/**
 * Programme grid for danceFM.
 *
 * Shows are intentionally empty for now — drop entries into the matching day
 * array and the whole site (schedule + "on air" indicators) picks them up.
 *
 * Show shape:
 * {
 *   id: "sunset-sessions",
 *   title: "Sunset Sessions",
 *   host: "Mara Klein",
 *   start: "18:00",          // Berlin time, 24h
 *   end: "20:00",            // may run past midnight (e.g. 02:00)
 *   cover: "/shows/sunset.jpg",
 *   genre: "Melodic House",          // or { en: "…", de: "…" }
 *   description: "Two hours of warm, rolling grooves."
 * }
 *
 * Text fields accept a plain string (same in every language) or a
 * { en, de } object so a show can be translated.
 */

import { localeFor } from "./i18n.js";

export const DAYS = [
  { key: "mon", index: 0 },
  { key: "tue", index: 1 },
  { key: "wed", index: 2 },
  { key: "thu", index: 3 },
  { key: "fri", index: 4 },
  { key: "sat", index: 5 },
  { key: "sun", index: 6 },
];

const DAY_NAMES = {
  en: {
    mon: { label: "Monday", short: "Mon" },
    tue: { label: "Tuesday", short: "Tue" },
    wed: { label: "Wednesday", short: "Wed" },
    thu: { label: "Thursday", short: "Thu" },
    fri: { label: "Friday", short: "Fri" },
    sat: { label: "Saturday", short: "Sat" },
    sun: { label: "Sunday", short: "Sun" },
  },
  de: {
    mon: { label: "Montag", short: "Mo" },
    tue: { label: "Dienstag", short: "Di" },
    wed: { label: "Mittwoch", short: "Mi" },
    thu: { label: "Donnerstag", short: "Do" },
    fri: { label: "Freitag", short: "Fr" },
    sat: { label: "Samstag", short: "Sa" },
    sun: { label: "Sonntag", short: "So" },
  },
};

export function getDayName(dayKey, lang = "en", short = false) {
  const names = DAY_NAMES[lang] ?? DAY_NAMES.en;
  const entry = names[dayKey] ?? DAY_NAMES.en[dayKey];
  return short ? entry.short : entry.label;
}

/** Picks the current language from a plain string or { en, de } object. */
export function translate(value, lang = "en") {
  if (value && typeof value === "object") {
    return value[lang] ?? value.en ?? Object.values(value)[0] ?? "";
  }
  return value ?? "";
}

const nonStop = {
  id: "dancefm-non-stop",
  title: "danceFM NON STOP",
  host: null,
  start: "12:00",
  end: "12:00",
  cover: null,
  genre: { en: "Nonstop dance", de: "Nonstop Dance" },
  description: {
    en: "Around the clock, all day, every day.",
    de: "Rund um die Uhr, jeden Tag.",
  },
};

export const DEFAULT_SCHEDULE = {
  mon: [{ ...nonStop }],
  tue: [{ ...nonStop }],
  wed: [{ ...nonStop }],
  thu: [{ ...nonStop }],
  fri: [{ ...nonStop }],
  sat: [{ ...nonStop }],
  sun: [{ ...nonStop }],
};

export let schedule = { ...DEFAULT_SCHEDULE };

export function setSchedule(nextSchedule) {
  if (!nextSchedule || typeof nextSchedule !== "object") return;

  const normalized = {};
  for (const day of DAYS) {
    const items = Array.isArray(nextSchedule[day.key]) ? nextSchedule[day.key] : [];
    normalized[day.key] = items
      .map((show, index) => ({
        id: show.id || `${day.key}-${show.title || "show"}-${show.start || index}`,
        title: show.title || "danceFM",
        host: show.host ?? null,
        start: show.start || "00:00",
        end: show.end || show.start || "00:00",
        cover: show.cover || null,
        genre: show.genre ?? { en: "Live", de: "Live" },
        description: show.description ?? null,
      }))
      .filter((show) => show.title || show.start);
  }

  schedule = normalized;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("dancefm-schedule-updated"));
  }
}

function parseExcelTime(value) {
  if (!value) return null;
  const match = String(value).match(/T(\d{1,2}):(\d{2})(?::(\d{2}))?/i);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const paddedHours = String(hours).padStart(2, "0");
  const paddedMinutes = String(minutes).padStart(2, "0");
  return `${paddedHours}:${paddedMinutes}`;
}

function cellText(cell) {
  if (!cell) return "";

  const directHref = cell.getAttribute("ss:HRef") || cell.getAttribute("HRef") || cell.getAttribute("href");
  if (directHref) return directHref.trim();

  const allNodes = Array.from(cell.getElementsByTagName("*"));
  const hyperlink = allNodes.find(
    (node) => (node.localName || node.nodeName.split(":").pop()) === "Hyperlink"
  );
  if (hyperlink && hyperlink.getAttribute("href")) {
    return hyperlink.getAttribute("href").trim();
  }

  const data = allNodes
    .filter((node) => (node.localName || node.nodeName.split(":").pop()) === "Data")
    .map((node) => node.textContent)
    .join(" ")
    .trim();

  if (data) return data.trim();

  return (cell.textContent || "").trim();
}

function parseGoogleSheetUrl(value) {
  if (!value) return null;
  const raw = String(value).trim();
  const matches = raw.match(/https?:\/\/[^\s<>"]+/i);
  return matches ? matches[0] : null;
}

export function parseScheduleXml(xmlText) {
  if (!xmlText || typeof DOMParser === "undefined") return null;

  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) return null;

  const sheet = Array.from(doc.getElementsByTagName("Worksheet")).find(
    (node) => (node.getAttribute("ss:Name") || node.getAttribute("Name")) === "Weekly Schedule"
  );
  if (!sheet) return null;

  const rows = Array.from(sheet.getElementsByTagName("Row"));
  if (!rows.length) return null;

  const dayNames = {
    mon: "monday",
    tue: "tuesday",
    wed: "wednesday",
    thu: "thursday",
    fri: "friday",
    sat: "saturday",
    sun: "sunday",
  };

  let dayIndexMap = {};
  const dayGroups = {};
  const dayKeys = DAYS.map((day) => day.key);
  for (const key of dayKeys) dayGroups[key] = [];

  const activeByDay = {};

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const rawCells = Array.from(rows[rowIndex].getElementsByTagName("Cell"));
    const cells = [];
    for (const cell of rawCells) {
      const indexValue = Number(cell.getAttribute("ss:Index") ?? cell.getAttribute("Index") ?? "");
      if (Number.isFinite(indexValue) && indexValue > 1 && cells.length < indexValue - 1) {
        while (cells.length < indexValue - 1) {
          cells.push(null);
        }
      }
      cells.push(cell);
    }
    const labels = cells.map((cell) => cellText(cell));
    const rowDayMap = {};
    for (let i = 0; i < labels.length; i += 1) {
      const dayKey = Object.entries(dayNames).find(
        ([, value]) => labels[i] && labels[i].toLowerCase() === value
      )?.[0];
      if (dayKey) rowDayMap[dayKey] = i;
    }

    if (Object.keys(rowDayMap).length) {
      dayIndexMap = rowDayMap;
      continue;
    }

    const start = parseExcelTime(cellText(cells[0]));
    if (!start || Object.keys(dayIndexMap).length === 0) continue;

    for (const day of DAYS) {
      const cellIndex = dayIndexMap[day.key];
      if (cellIndex === undefined) continue;

      const titleCell = cells[cellIndex];
      const coverCell = cells[cellIndex + 1];
      const rawTitle = (cellText(titleCell) || "").trim();
      const coverRaw = coverCell ? parseGoogleSheetUrl(cellText(coverCell)) : null;
      const previous = activeByDay[day.key];

      if (!rawTitle && previous) {
        previous.end = start;
        continue;
      }

      if (!rawTitle) continue;

      const boothMatch = rawTitle.match(/^danceFM BOOTH with\s+(.+)$/i);
      const title = boothMatch ? "danceFM BOOTH" : rawTitle;
      const host = boothMatch ? boothMatch[1].trim() : null;

      if (previous) previous.end = start;

      const show = {
        id: `${day.key}-${start}-${title}`,
        title,
        host,
        start,
        end: start,
        cover: coverRaw || null,
        genre: { en: "Live", de: "Live" },
        description: null,
      };

      dayGroups[day.key].push(show);
      activeByDay[day.key] = show;
    }
  }

  for (const day of DAYS) {
    const shows = dayGroups[day.key];
    const last = shows[shows.length - 1];
    if (day.key === "sun" && last && last.start >= "02:00" && last.end === "23:00") {
      last.end = "00:00";
    } else if (last && last.end === last.start && last.start === "23:00") {
      last.end = "00:00";
    } else if (last && last.end && last.start && last.end <= last.start && last.start !== "00:00") {
      last.end = "00:00";
    }

    for (let i = 0; i < shows.length; i += 1) {
      const current = shows[i];
      const next = shows[i + 1];
      if (current.end === current.start && next) {
        current.end = next.start;
      }
    }

    const merged = [];
    for (const show of shows) {
      const previous = merged[merged.length - 1];
      if (previous && previous.title === show.title && previous.cover === show.cover && previous.end === show.start) {
        previous.end = show.end || previous.end;
      } else {
        merged.push({ ...show });
      }
    }
    dayGroups[day.key] = merged;
  }

  return dayGroups;
}

export function toMinutes(time) {
  const [hours, minutes] = String(time || "0:0").split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

export function formatTimeRange(show) {
  return `${show.start} – ${show.end}`;
}

/** Berlin wall-clock parts for a given instant. */
export function getBerlinParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type) => parts.find((part) => part.type === type)?.value;
  const weekday = get("weekday");
  const map = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const index = map[weekday] ?? 0;

  return {
    index,
    weekday,
    dayKey: DAYS[index].key,
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
    second: Number(get("second")),
    minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")),
  };
}

/** CET when winter time is in effect, CEST during daylight saving. */
export function getBerlinZoneLabel(date = new Date(), lang = "en") {
  const offset = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    timeZoneName: "shortOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  const summer = offset === "GMT+2";
  if (lang === "de") return summer ? "MESZ" : "MEZ";
  return summer ? "CEST" : "CET";
}

/** Dates (Mon–Sun) of the current Berlin week, as day-of-month numbers. */
export function getWeekDates(date = new Date(), lang = "en") {
  const today = getBerlinParts(date);
  return DAYS.map((day) => {
    const offset = day.index - today.index;
    const shifted = new Date(date.getTime() + offset * 86400000);
    const label = new Intl.DateTimeFormat(localeFor(lang), {
      timeZone: "Europe/Berlin",
      day: "2-digit",
      month: "short",
    }).format(shifted);
    return {
      ...day,
      label: getDayName(day.key, lang),
      short: getDayName(day.key, lang, true),
      dateLabel: label,
    };
  });
}

function showIsLive(show, minutes) {
  const start = toMinutes(show.start);
  const end = toMinutes(show.end);
  // same start and end means a show that runs a full 24 hours
  if (start === end) return true;
  if (end > start) return minutes >= start && minutes < end;
  // runs past midnight
  return minutes >= start || minutes < end;
}

/**
 * Returns the show currently on air (including yesterday's overnight shows),
 * plus the selected day's shows sorted by start time.
 */
export function getOnAir(date = new Date()) {
  const berlin = getBerlinParts(date);

  for (let offset = 0; offset <= 1; offset += 1) {
    const dayIndex = (berlin.index - offset + 7) % 7;
    const day = DAYS[dayIndex];
    const shows = [...(schedule[day.key] || [])];

    for (const show of shows) {
      const start = toMinutes(show.start);
      const end = toMinutes(show.end);
      const overnight = end <= start;
      if (offset === 1 && !overnight) continue;
      if (showIsLive(show, berlin.minutes)) {
        const duration = overnight ? 1440 - start + end : end - start;
        // a 12:00 → 12:00 show is a full day
        const fullDay = start === end;
        const elapsed = fullDay
          ? (berlin.minutes - start + 1440) % 1440
          : overnight && berlin.minutes < end
            ? 1440 - start + berlin.minutes
            : berlin.minutes - start;
        return {
          show,
          day,
          progress:
            duration > 0 ? Math.min(1, Math.max(0, elapsed / duration)) : 0,
        };
      }
    }
  }

  return null;
}

export function getDayShows(dayKey) {
  return [...(schedule[dayKey] || [])].sort(
    (a, b) => toMinutes(a.start) - toMinutes(b.start)
  );
}
