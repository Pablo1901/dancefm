import { DEFAULT_SCHEDULE } from "@/lib/schedule";

// The live programme grid is maintained in a shared Dropbox spreadsheet. The
// route pulls it directly from the link below on every request so the site
// updates as soon as the station re-saves the file — no local downloads, no
// static XML to keep in sync.
const SCHEDULE_URL =
  "https://www.dropbox.com/scl/fi/q6re2w84gr8w2gim2takt/weekly_schedule.xml?rlkey=vjg6lqdeplmy5qab6u2izpqc6&st=ehbwyy7x&dl=1";

function parseExcelTime(value) {
  if (!value) return null;
  const match = String(value).match(/T(\d{1,2}):(\d{2})(?::(\d{2}))?/i);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function extractDataText(cell) {
  const data = cell.match(/<Data[^>]*>([\s\S]*?)<\/Data>/);
  if (data) return data[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return cell.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseRowCells(rowHtml) {
  if (!rowHtml) return [];
  const cells = [];
  let cursor = 0;

  while (cursor < rowHtml.length) {
    const cellStart = rowHtml.indexOf("<Cell", cursor);
    if (cellStart === -1) break;

    const openTagEnd = rowHtml.indexOf(">", cellStart);
    if (openTagEnd === -1) break;

    const cellTag = rowHtml.slice(cellStart, openTagEnd + 1);
    const indexMatch = cellTag.match(/(?:^|\s)ss:Index\s*=\s*"?(\d+)"?/i) ||
                       cellTag.match(/(?:^|\s)Index\s*=\s*"?(\d+)"?/i);
    const targetIndex = indexMatch ? Number(indexMatch[1]) : cells.length + 1;

    while (cells.length < targetIndex - 1) {
      cells.push("");
    }

    if (cellTag.trimEnd().endsWith("/>")) {
      cells.push("");
      cursor = openTagEnd + 1;
      continue;
    }

    const hrefMatch = cellTag.match(/(?:^|\s)ss:HRef\s*=\s*"?([^\"\s>]+)"?/i) ||
                      cellTag.match(/(?:^|\s)HRef\s*=\s*"?([^\"\s>]+)"?/i);

    const closeIndex = rowHtml.indexOf("</Cell", openTagEnd + 1);
    if (closeIndex === -1) break;

    const closeTagEnd = rowHtml.indexOf(">", closeIndex);
    if (closeTagEnd === -1) break;

    const content = rowHtml.slice(openTagEnd + 1, closeIndex);
    cells.push(hrefMatch ? hrefMatch[1].trim() : extractDataText(content));
    cursor = closeTagEnd + 1;
  }

  return cells;
}

function parseDropboxSchedule(xml) {
  if (!xml) return DEFAULT_SCHEDULE;

  const rowMatches = [...xml.matchAll(
    /<(?:[^>\s]+:)?Row(?:\s[^>]*)?>([\s\S]*?)<\/(?:[^>\s]+:)?Row>/gi
  )];
  if (!rowMatches.length) return DEFAULT_SCHEDULE;

  const rows = rowMatches.map((m) => m[1]);

  if (!rows.length) return DEFAULT_SCHEDULE;

  // Header row: Time, Monday, Monday Cover, Tuesday, Tuesday Cover, ...
  // Column positions: Time=0, Monday=1, MondayCover=2, Tuesday=3, ...
  const headerCells = rows[0].match(
    /<(?:[^>\s]+:)?Cell(?:\s[^>]*)?>([\s\S]*?)<\/(?:[^>\s]+:)?Cell>/gi
  ) || [];
  const dayNames = {
    mon: "monday", tue: "tuesday", wed: "wednesday",
    thu: "thursday", fri: "friday", sat: "saturday", sun: "sunday",
  };
  const headerIndex = {};
  for (let i = 0; i < headerCells.length; i += 1) {
    const label = extractDataText(headerCells[i]);
    const dayKey = Object.entries(dayNames).find(
      ([key, value]) => value === String(label).toLowerCase()
    )?.[0];
    if (dayKey) headerIndex[dayKey] = i;
  }

  const dayKeys = Object.keys(dayNames);
  const groups = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
  const activeByDay = {};

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const cells = parseRowCells(rows[rowIndex]);
    const rowTime = parseExcelTime(cells[0]);
    if (!rowTime) continue;

    for (const dayKey of dayKeys) {
      const titleCellIndex = headerIndex[dayKey];
      if (titleCellIndex === undefined || titleCellIndex >= cells.length) continue;

      const rawTitle = (cells[titleCellIndex] || "").trim();
      if (!rawTitle) continue;

      const previous = activeByDay[dayKey];
      if (previous) previous.end = rowTime;

      const boothMatch = rawTitle.match(/^danceFM BOOTH with\s+(.+)$/i);
      const title = boothMatch ? "danceFM BOOTH" : rawTitle;
      const host = boothMatch ? boothMatch[1].trim() : null;

      const coverIndex = titleCellIndex + 1;
      const coverRaw = coverIndex < cells.length ? cells[coverIndex] : "";
      const cover = /^https?:\/\//i.test(coverRaw) ? coverRaw.trim() : null;

      activeByDay[dayKey] = {
        id: `${dayKey}-${rowTime}-${title}`,
        title,
        host,
        start: rowTime,
        end: rowTime,
        cover,
        genre: { en: "Live", de: "Live" },
        description: null,
      };

      groups[dayKey].push(activeByDay[dayKey]);
    }
  }

  for (const dayKey of dayKeys) {
    const dayShows = groups[dayKey];
    const last = dayShows[dayShows.length - 1];
    if (dayKey === "sun" && last && last.start >= "02:00" && last.end === "23:00") {
      last.end = "00:00";
    } else if (last && last.end === last.start && last.start === "23:00") {
      last.end = "00:00";
    } else if (last && last.end && last.start && last.end <= last.start && last.start !== "00:00") {
      last.end = "00:00";
    }

    for (let i = 0; i < dayShows.length; i += 1) {
      const current = dayShows[i];
      const next = dayShows[i + 1];
      if (current.end === current.start && next) {
        current.end = next.start;
      }
    }

    const merged = [];
    for (const show of dayShows) {
      const previous = merged[merged.length - 1];
      if (
        previous &&
        previous.title === show.title &&
        previous.cover === show.cover &&
        previous.end === show.start
      ) {
        previous.end = show.end || previous.end;
      } else {
        merged.push({ ...show });
      }
    }

    groups[dayKey] = merged;
  }

  return groups;
}

export async function GET() {
  try {
    const res = await fetch(SCHEDULE_URL, {
      cache: "no-store",
      headers: {
        Accept: "application/xml, text/xml, */*",
        "User-Agent": "danceFM/1.0 (+https://dancefm.radio)",
      },
    });

    if (!res.ok) throw new Error(`Dropbox responded ${res.status}`);

    const xml = await res.text();
    const data = parseDropboxSchedule(xml);
    return Response.json(data, {
      headers: {
        "Cache-Control": "no-store",
        "X-Schedule-Source": "dropbox",
      },
    });
  } catch {
    return Response.json(DEFAULT_SCHEDULE, {
      headers: {
        "Cache-Control": "no-store, max-age=0, s-maxage=30, stale-while-revalidate=300",
        "X-Schedule-Source": "fallback",
      },
    });
  }
}
