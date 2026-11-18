"use client";

import { ArrowIcon } from "./icons";
import { useLanguage } from "./language-context";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <img
              src="/brand/logo-wordmark.webp"
              alt="danceFM"
              width="180"
              height="40"
              className="footer-logo"
            />
            <p className="footer-blurb">{t.footer.blurb}</p>
          </div>

          <div className="footer-cols">
            <div className="footer-col">
              <p className="footer-heading">{t.footer.station}</p>
              <a href="#listen">{t.footer.listen}</a>
              <a href="#schedule">{t.footer.schedule}</a>
              <a href="#news">{t.footer.news}</a>
              <a href="mailto:contact.pablomusic@proton.me?subject=Contact%20danceFM&body=Hi%20Pablo%2C%0A%0A%0AI%20wanted%20to%20get%20in%20touch%20about%20the%20station.%0A">Contact</a>
              <a href="#about">{t.footer.about}</a>
            </div>
            <div className="footer-col">
              <p className="footer-heading">{t.footer.elsewhere}</p>
              <a
                href="https://onlineradiobox.com/de/pablo/"
                target="_blank"
                rel="noreferrer noopener"
                className="footer-external"
              >
                Online Radio Box
                <ArrowIcon className="icon-xs" />
              </a>
              <a
                href="https://djmag.com"
                target="_blank"
                rel="noreferrer noopener"
                className="footer-external"
              >
                DJ Mag
                <ArrowIcon className="icon-xs" />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-thanks">
          <p className="footer-thanks-title">{t.footer.thanksTitle}</p>
          <div className="footer-thanks-logos">
            <a
              href="http://zeno.fm/"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Zeno"
            >
              <img src="/brand/zeno.png" alt="Zeno" loading="lazy" />
            </a>
            <a
              href="https://www.djsoft.net/"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="RadioBoss"
            >
              <img src="/brand/radioboss.png" alt="RadioBoss" loading="lazy" />
            </a>
            <a
              href="http://onlineradiobox.com/"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Online Radio Box"
            >
              <img
                src="/brand/online-radio-box.png"
                alt="Online Radio Box"
                loading="lazy"
              />
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-rights">{t.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}
