"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowIcon, CloseIcon, ClockIcon } from "./icons";
import { useLanguage } from "./language-context";
import { fill, localeFor } from "@/lib/i18n";

function formatPublished(article, lang) {
  const date = new Date(article.publishedAt);
  if (Number.isNaN(date.getTime())) return article.publishedLabel || "";
  return new Intl.DateTimeFormat(localeFor(lang), {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(date);
}

export default function News({ articles = [] }) {
  const [active, setActive] = useState(null);
  const { lang, t } = useLanguage();

  const close = useCallback(() => setActive(null), []);

  useEffect(() => {
    if (!active) return;
    const onKey = (event) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active, close]);

  return (
    <section className="section news" id="news">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow eyebrow--plain">{t.news.eyebrow}</span>
            <h2 className="section-title">
              {t.news.titleA}{" "}
              <span className="gradient-text">{t.news.titleB}</span>
            </h2>
            <p className="section-copy">{t.news.copy}</p>
          </div>
          <div className="section-aside">
            <a
              className="text-link"
              href="https://djmag.com"
              target="_blank"
              rel="noreferrer noopener"
            >
              djmag.com
              <ArrowIcon className="icon-xs" />
            </a>
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="news-empty">
            <p>{t.news.emptyTitle}</p>
            <a
              className="text-link"
              href="https://djmag.com"
              target="_blank"
              rel="noreferrer noopener"
            >
              {t.news.visit}
              <ArrowIcon className="icon-xs" />
            </a>
          </div>
        ) : (
          <div className="news-grid">
            {articles.map((article, index) => (
              <article
                className={`news-card ${index === 0 ? "is-featured" : ""}`}
                key={article.id}
              >
                <button
                  type="button"
                  className="news-card-button"
                  onClick={() => setActive(article)}
                  aria-haspopup="dialog"
                >
                  <span className="news-media">
                    {article.image ? (
                      <img
                        src={article.image}
                        alt=""
                        loading={index > 2 ? "lazy" : "eager"}
                        className="news-image"
                      />
                    ) : (
                      <span className="news-image news-image--empty" />
                    )}
                    <span className="news-category">{article.category}</span>
                  </span>
                  <span className="news-body">
                    <span className="news-meta">
                      {formatPublished(article, lang)}
                      <span className="dot-sep" aria-hidden="true" />
                      {fill(t.news.minRead, { n: article.readingTime })}
                    </span>
                    <h3 className="news-title">{article.title}</h3>
                    {article.excerpt ? (
                      <span className="news-excerpt">{article.excerpt}</span>
                    ) : null}
                    <span className="news-cta">
                      {t.news.readStory}
                      <ArrowIcon className="icon-xs" />
                    </span>
                  </span>
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      {active ? (
        <div className="reader-backdrop" onClick={close} role="presentation">
          <div
            className="reader"
            role="dialog"
            aria-modal="true"
            aria-label={active.title}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="reader-close"
              onClick={close}
              aria-label={t.news.close}
            >
              <CloseIcon />
            </button>

            {active.image ? (
              <div className="reader-hero">
                <img src={active.image} alt="" className="reader-image" />
                <div className="reader-hero-fade" aria-hidden="true" />
              </div>
            ) : null}

            <div className="reader-body">
              <div className="reader-meta">
                <span className="news-category news-category--solid">
                  {active.category}
                </span>
                <span className="reader-meta-text">
                  <ClockIcon className="icon-xs" />
                  {fill(t.news.minRead, { n: active.readingTime })}
                </span>
                <span className="dot-sep" aria-hidden="true" />
                <span className="reader-meta-text">
                  {formatPublished(active, lang)}
                </span>
              </div>

              <h3 className="reader-title">{active.title}</h3>
              <p className="reader-byline">
                {fill(t.news.by, { author: active.author })}
              </p>
              <p className="reader-excerpt">{active.excerpt}</p>
              <p className="reader-note">{t.news.note}</p>

              <div className="reader-actions">
                <a
                  className="button button--primary"
                  href={active.link}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {t.news.continue}
                  <ArrowIcon className="icon-sm" />
                </a>
                <button type="button" className="button button--ghost" onClick={close}>
                  {t.news.back}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
