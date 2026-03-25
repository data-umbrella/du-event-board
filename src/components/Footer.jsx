import { Link } from "react-router-dom";
import "./Footer.css";

const NAV_LINKS = [
  {
    label: "About Us",
    href: "https://www.dataumbrella.org/about/about-data-umbrella",
  },
  { label: "FAQs", href: "https://www.dataumbrella.org/about/faq" },
  {
    label: "Donate",
    href: "https://www.every.org/data-umbrella",
    external: true,
  },
  { label: "Sponsors", href: "https://www.dataumbrella.org/about/sponsors" },
  { label: "Contact Us", href: "mailto:info@dataumbrella.org" },
  {
    label: "Data Umbrella",
    href: "https://www.dataumbrella.org",
    external: true,
  },
];

const SOCIAL_LINKS = [
  {
    name: "GitHub",
    href: "https://github.com/data-umbrella",
    ariaLabel: "Data Umbrella on GitHub",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  {
    name: "Twitter",
    href: "https://twitter.com/DataUmbrella",
    ariaLabel: "Data Umbrella on Twitter / X",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.262 5.636 5.902-5.636Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

function ExternalIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="footer-ext-icon"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-inner">
        {/* ── Three-column main row ───────────────── */}
        <div className="footer-main">
          {/* Column 1 — Brand */}
          <div className="footer-brand">
            <a
              href="https://www.dataumbrella.org"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Data Umbrella website"
            >
              <img
                src="https://www.dataumbrella.org/assets/images/logo-light.png"
                alt="Data Umbrella"
                className="footer-logo"
                width="160"
                loading="lazy"
              />
            </a>

            <p className="footer-tagline">
              A data science and open source community.
            </p>

            <div className="footer-socials" aria-label="Social links">
              {SOCIAL_LINKS.map(({ name, href, ariaLabel, icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={ariaLabel}
                  className="footer-social-btn"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 — Navigation */}
          <nav className="footer-nav" aria-label="Footer navigation">
            <ul className="footer-nav-list">
              {NAV_LINKS.map(({ label, href, external }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="footer-nav-link"
                    {...(external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {label}
                    {external && <ExternalIcon />}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 3 — Give Suggestions */}
          <div className="footer-suggestions">
            <h2 className="footer-suggestions-title">Give Suggestions</h2>
            <p className="footer-suggestions-desc">
              Have an idea or spotted something that could be improved? Share
              your feedback with the Data Umbrella community.
            </p>
            <Link to="/suggestions" className="footer-suggestions-btn">
              Share your feedback
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>

        {/* ── Bottom copyright bar ──────────────────── */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; Data Umbrella {currentYear}
          </p>
          <p className="footer-built-by">
            DU Event Board &mdash; Built with{" "}
            <span role="img" aria-label="love">
              ❤️
            </span>{" "}
            by the community.{" "}
            <a
              href="https://github.com/data-umbrella/du-event-board"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-inline-link"
            >
              Contribute on GitHub
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
