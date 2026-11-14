"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DAYS,
  getBerlinParts,
  getBerlinZoneLabel,
  getDayName,
  getDayShows,
  getOnAir,
  getWeekDates,
  setSchedule,
  translate,
} from "@/lib/schedule";
import { fill } from "@/lib/i18n";
import { useLanguage } from "./language-context";
import { ClockIcon, WaveformIcon } from "./icons";

function nowStamp() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function optimizeCoverUrl(url, width = 120, quality = 60) {
  if (!url || typeof url !== "string") return url;
  if (url.startsWith("/")) return url;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("dropbox.com")) {
      parsed.searchParams.set("raw", "1");
      parsed.searchParams.set("dl", "1");
      return parsed.toString();
    }

    if (host.includes("sndcdn.com") || host.includes("livetracklist.com")) {
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("h", String(width));
      parsed.searchParams.set("q", String(quality));
      parsed.searchParams.set("fit", "crop");
      return parsed.toString();
    }

    if (host.includes("podtoo.com") || host.includes("syndicast.co.uk")) {
      return url;
    }

    return url;
  } catch {
    return url;
  }
}

export default function Schedule() {
  const { lang, t } = useLanguage();
  const [todayIndex, setTodayIndex] = useState(0);
  const [selected, setSelected] = useState(0);
  const [onAir, setOnAir] = useState(null);
  const [zone, setZone] = useState("CET");
  const [clock, setClock] = useState("");
  const [week, setWeek] = useState([]);
  const [scheduleVersion, setScheduleVersion] = useState(0);

  useEffect(() => {
    const sync = () => {
      const now = new Date();
      const berlin = getBerlinParts(now);
      setTodayIndex(berlin.index);
      setSelected((current) => (current === null ? berlin.index : current));
      setOnAir(getOnAir(now));
      setZone(getBerlinZoneLabel(now, lang));
      setWeek(getWeekDates(now, lang));
      setClock(nowStamp());
    };

    const loadRemoteSchedule = async () => {
      try {
        const res = await fetch("/api/schedule", { cache: "no-store" });
        if (!res.ok) return;
        const parsed = await res.json();
        if (parsed && typeof parsed === "object") {
          setSchedule(parsed);
          setScheduleVersion((current) => current + 1);
          setOnAir(getOnAir(new Date()));
        }
      } catch {
        // Keep the built-in schedule fallback if the remote feed is unavailable.
      }
    };

    setSelected(getBerlinParts().index);
    sync();
    loadRemoteSchedule();
    const id = setInterval(sync, 30000);
    return () => clearInterval(id);
  }, [lang]);

  const dayKey = DAYS[selected]?.key ?? DAYS[0].key;
  const dayLabel = getDayName(dayKey, lang);
  const shows = useMemo(() => getDayShows(dayKey), [dayKey, scheduleVersion]);
  const dayMeta = week.find((item) => item.key === dayKey);

  return (
    <section className="section schedule" id="schedule">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow eyebrow--plain">{t.schedule.eyebrow}</span>
            <h2 className="section-title">
              {t.schedule.titleA}{" "}
              <span className="gradient-text">{t.schedule.titleB}</span>
            </h2>
            <p className="section-copy">
              {t.schedule.copy} {fill(t.schedule.allTimes, { zone })}
            </p>
          </div>
          <div className="section-aside">
            <span className="chip">
              <ClockIcon className="icon-xs" />
              {clock || "--:--"} · {zone}
            </span>
            {onAir ? (
              <span className="chip chip--live">
                <span className="live-dot" aria-hidden="true" />
                {t.schedule.livePrefix}
                {onAir.show.title}
              </span>
            ) : (
              <span className="chip chip--muted">
                <span className="live-dot" aria-hidden="true" />
                {t.schedule.nonstop}
              </span>
            )}
          </div>
        </div>

        <div className="schedule-shell">
          <div className="day-tabs" role="tablist" aria-label={t.schedule.dayAria}>
            {DAYS.map((item, index) => {
              const meta = week.find((entry) => entry.key === item.key);
              const isToday = index === todayIndex;
              const isActive = index === selected;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`day-tab ${isActive ? "is-active" : ""} ${
                    isToday ? "is-today" : ""
                  }`}
                  onClick={() => setSelected(index)}
                >
                  <span className="day-tab-name">
                    {getDayName(item.key, lang, true)}
                  </span>
                  <span className="day-tab-date">
                    {meta ? meta.dateLabel.split(" ")[0] : "—"}
                  </span>
                  {isToday ? <span className="day-tab-dot" aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>

          <div className="schedule-panel">
            <aside className="schedule-aside">
              <p className="aside-kicker">
                {todayIndex === selected ? t.schedule.today : t.schedule.selected}
              </p>
              <h3 className="aside-day">{dayLabel}</h3>
              <p className="aside-date">{dayMeta ? dayMeta.dateLabel : ""}</p>

              <div className="onair-box">
                <span className="onair-box-label">
                  <span
                    className={`live-dot ${onAir ? "" : "is-idle"}`}
                    aria-hidden="true"
                  />
                  {t.schedule.onAirNow}
                </span>
                {onAir ? (
                  <>
                    <p className="onair-box-title">{onAir.show.title}</p>
                    <p className="onair-box-time">
                      {onAir.show.start} – {onAir.show.end} {zone}
                    </p>
                    <div className="onair-progress" aria-hidden="true">
                      <span
                        style={{ width: `${Math.round(onAir.progress * 100)}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="onair-box-title">{t.schedule.nonstop}</p>
                    <p className="onair-box-time">
                      {t.schedule.untilNextShow} · {clock || "--:--"} {zone}
                    </p>
                  </>
                )}
              </div>

              <p className="aside-note">{fill(t.schedule.allTimes, { zone })}</p>
            </aside>

            <div className="schedule-list">
              {shows.length === 0 ? (
                <div className="schedule-empty">
                  <span className="schedule-empty-icon">
                    <WaveformIcon />
                  </span>
                  <h4>{fill(t.schedule.emptyTitle, { day: dayLabel })}</h4>
                  <p>{t.schedule.emptyText}</p>
                  <span className="schedule-empty-tag">{t.schedule.emptyTag}</span>
                </div>
              ) : (
                <ul className="show-list">
                  {shows.map((show) => {
                    const live = onAir?.show?.id === show.id;
                    const genre = translate(show.genre, lang);
                    const description = translate(show.description, lang);
                    const host = show.host
                      ? fill(t.schedule.withHost, { host: show.host })
                      : null;

                    return (
                      <li className={`show-row ${live ? "is-live" : ""}`} key={show.id}>
                        <img
                          src={optimizeCoverUrl(show.cover || "/brand/logo-square.webp")}
                          alt=""
                          className="show-cover"
                          width="72"
                          height="72"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="show-body">
                          <div className="show-topline">
                            <span className="show-time">
                              {show.start} – {show.end}
                            </span>
                            {live ? (
                              <span className="show-live">{t.schedule.live}</span>
                            ) : null}
                            {genre ? (
                              <span className="show-genre">{genre}</span>
                            ) : null}
                          </div>
                          <p className="show-title">{show.title}</p>
                          <p className="show-host">
                            {[host, description].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        {live ? (
                          <div className="show-pulse" aria-hidden="true" />
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
