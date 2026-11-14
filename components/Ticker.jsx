"use client";

import { useLanguage } from "./language-context";

export default function Ticker() {
  const { t } = useLanguage();
  const words = t.ticker;
  const row = [...words, ...words];

  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {row.map((word, index) => (
          <span className="ticker-item" key={`${word}-${index}`}>
            {word}
            <span className="ticker-star">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
