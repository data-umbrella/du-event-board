import React from "react";
import { ExternalLink, Github, Twitter } from "lucide-react";

export default function Footer({ onNavigate }) {
  return (
    <footer className="footer">
      <div className="footer__divider"></div>
      <div className="footer__content">
        <div className="footer__brand">
          <img
            src="https://github.com/data-umbrella.png"
            alt="Data <Umbrella> Logo"
            className="footer__logo"
          />
          <span className="footer__company-name">Data Umbrella</span>
          <span className="footer__tagline">
            A data science and open source community
          </span>

          <div className="footer__socials">
            <a
              href="https://github.com/data-umbrella"
              aria-label="GitHub"
              className="footer__social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github size={20} strokeWidth={1.5} />
            </a>
            <a
              href="https://x.com/dataumbrella"
              aria-label="Twitter"
              className="footer__social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Twitter size={20} strokeWidth={1.5} />
            </a>
          </div>
        </div>

        <div className="footer__links">
          <div className="footer__column">
            <button
              onClick={() =>
                onNavigate ? onNavigate("about") : (window.location.href = "/")
              }
              className="footer__internal-link"
            >
              About Us
            </button>
            <button
              onClick={() =>
                onNavigate
                  ? onNavigate("events")
                  : (window.location.href = "/")
              }
              className="footer__internal-link"
            >
              FAQs
            </button>
          </div>

          <div className="footer__column">
            <a
              href="https://opencollective.com/data-umbrella"
              target="_blank"
              rel="noopener noreferrer"
              className="footer__external-link"
            >
              Donate{" "}
              <ExternalLink size={14} className="footer__external-icon" />
            </a>
            <button
              onClick={() =>
                onNavigate
                  ? onNavigate("sponsors")
                  : (window.location.href = "/")
              }
              className="footer__internal-link"
            >
              Sponsors
            </button>
          </div>

          <div className="footer__column">
            <button
              onClick={() =>
                onNavigate
                  ? onNavigate("events")
                  : (window.location.href = "/")
              }
              className="footer__internal-link"
            >
              Contact Us
            </button>
            <a
              href="https://www.dataumbrella.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer__external-link"
            >
              Data Umbrella{" "}
              <ExternalLink size={14} className="footer__external-icon" />
            </a>
          </div>
        </div>
      </div>
      <div className="footer__copyright">
        &copy; Data Umbrella {new Date().getFullYear()}
      </div>
    </footer>
  );
}
