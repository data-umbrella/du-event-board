import React from "react";
import { ExternalLink, Github, Linkedin } from "lucide-react";

export default function Footer({ onNavigate }) {
  return (
    <footer className="footer">
      <div className="footer__divider"></div>
      <div className="footer__content">
        <div className="footer__brand">
          <img
            src="https://github.com/data-umbrella.png"
            alt="Data Umbrella logo"
            className="footer__logo"
          />
          <span className="footer__company-name">Data Umbrella</span>
          <span className="footer__tagline">
            A data science and open source community
          </span>

          <div className="footer__socials">
            <a
              href="https://github.com/data-umbrella"
              aria-label="Data Umbrella on GitHub"
              className="footer__social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github size={20} strokeWidth={1.5} aria-hidden="true" />
            </a>
            <a
              href="https://bsky.app/profile/dataumbrella.org"
              aria-label="Data Umbrella on Bluesky"
              className="footer__social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={`${import.meta.env.BASE_URL}Bluesky.png`}
                alt=""
                className="footer__social-icon"
              />
            </a>
            <a
              href="https://www.linkedin.com/company/dataumbrella/?viewAsMember=true"
              aria-label="Data Umbrella on LinkedIn"
              className="footer__social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Linkedin size={20} strokeWidth={1.5} aria-hidden="true" />
            </a>
          </div>
        </div>

        <nav aria-label="Footer">
          <div className="footer__links">
            <div className="footer__column">
              <a
                href="?page=about"
                onClick={(e) => {
                  if (!onNavigate) return;
                  e.preventDefault();
                  onNavigate("about");
                }}
                className="footer__internal-link"
              >
                About Us
              </a>
              <a
                href="?page=events"
                onClick={(e) => {
                  if (!onNavigate) return;
                  e.preventDefault();
                  onNavigate("events");
                }}
                className="footer__internal-link"
              >
                FAQs
              </a>
            </div>

            <div className="footer__column">
              <a
                href="https://www.every.org/data-umbrella"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__external-link"
              >
                Donate{" "}
                <ExternalLink
                  size={14}
                  aria-hidden="true"
                  className="footer__external-icon"
                />
              </a>
              <a
                href="?page=sponsors"
                onClick={(e) => {
                  if (!onNavigate) return;
                  e.preventDefault();
                  onNavigate("sponsors");
                }}
                className="footer__internal-link"
              >
                Sponsors
              </a>
            </div>

            <div className="footer__column">
              <a
                href="?page=events"
                onClick={(e) => {
                  if (!onNavigate) return;
                  e.preventDefault();
                  onNavigate("events");
                }}
                className="footer__internal-link"
              >
                Contact Us
              </a>
              <a
                href="https://www.dataumbrella.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__external-link"
              >
                Data Umbrella{" "}
                <ExternalLink
                  size={14}
                  aria-hidden="true"
                  className="footer__external-icon"
                />
              </a>
            </div>
          </div>
        </nav>
      </div>
      <div className="footer__copyright">
        &copy; Data Umbrella {new Date().getFullYear()}
      </div>
    </footer>
  );
}
