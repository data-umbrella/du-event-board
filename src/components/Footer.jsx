import React, { useState, useEffect } from "react";
import { ExternalLink, Github, Linkedin, ChevronDown } from "lucide-react";

export default function Footer({ onNavigate, theme }) {
  const [openAccordion, setOpenAccordion] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleAccordion = (section) => {
    if (!isMobile) return;
    setOpenAccordion(openAccordion === section ? null : section);
  };

  return (
    <footer className="footer">
      <div className="footer__divider"></div>
      <div className="footer__content">
        {/* Brand Section */}
        <div className="footer__brand">
          <img
            src={
              theme === "dark"
                ? "/DU_logo.png"
                : "https://github.com/data-umbrella.png"
            }
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
              href="https://bsky.app/profile/dataumbrella.org"
              aria-label="Bluesky"
              className="footer__social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={`${import.meta.env.BASE_URL}Bluesky.png`}
                alt="Bluesky"
                style={{ width: "20px", height: "auto" }}
              />
            </a>
            <a
              href="https://www.linkedin.com/company/dataumbrella/?viewAsMember=true"
              aria-label="LinkedIn"
              className="footer__social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Linkedin size={20} strokeWidth={1.5} />
            </a>
          </div>
        </div>

        {/* Links Section */}
        <div className="footer__links">
          {/* Column 1: Company */}
          <div
            className={`footer__column ${openAccordion === "company" ? "open" : ""}`}
          >
            <button
              className="footer__column-header"
              onClick={() => toggleAccordion("company")}
            >
              Company
              {isMobile && (
                <ChevronDown
                  size={16}
                  className={`footer__chevron ${openAccordion === "company" ? "open" : ""}`}
                />
              )}
            </button>
            <div className="footer__column-content">
              <button
                onClick={() =>
                  onNavigate
                    ? onNavigate("about")
                    : (window.location.href = "/")
                }
                className="footer__internal-link"
              >
                About Us
              </button>
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
              <button
                onClick={() =>
                  onNavigate
                    ? onNavigate("contact")
                    : (window.location.href = "/")
                }
                className="footer__internal-link"
              >
                Contact Us
              </button>
            </div>
          </div>

          {/* Column 2: Community */}
          <div
            className={`footer__column ${openAccordion === "community" ? "open" : ""}`}
          >
            <button
              className="footer__column-header"
              onClick={() => toggleAccordion("community")}
            >
              Community
              {isMobile && (
                <ChevronDown
                  size={16}
                  className={`footer__chevron ${openAccordion === "community" ? "open" : ""}`}
                />
              )}
            </button>
            <div className="footer__column-content">
              <a
                href="https://www.dataumbrella.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__external-link"
              >
                Data Umbrella{" "}
                <ExternalLink size={14} className="footer__external-icon" />
              </a>
              <a
                href="https://github.com/data-umbrella/du-event-board/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__external-link"
              >
                Contribute{" "}
                <ExternalLink size={14} className="footer__external-icon" />
              </a>
              <a
                href="https://www.every.org/data-umbrella"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__external-link"
              >
                Donate{" "}
                <ExternalLink size={14} className="footer__external-icon" />
              </a>
            </div>
          </div>

          {/* Column 3: Resources */}
          <div
            className={`footer__column ${openAccordion === "resources" ? "open" : ""}`}
          >
            <button
              className="footer__column-header"
              onClick={() => toggleAccordion("resources")}
            >
              Resources
              {isMobile && (
                <ChevronDown
                  size={16}
                  className={`footer__chevron ${openAccordion === "resources" ? "open" : ""}`}
                />
              )}
            </button>
            <div className="footer__column-content">
              <button
                onClick={() =>
                  onNavigate ? onNavigate("faq") : (window.location.href = "/")
                }
                className="footer__internal-link"
              >
                FAQs
              </button>
              <button
                onClick={() =>
                  onNavigate
                    ? onNavigate("privacy")
                    : (window.location.href = "/")
                }
                className="footer__internal-link"
              >
                Privacy Policy
              </button>
              <a
                href="https://github.com/data-umbrella/du-event-board/blob/main/CODE_OF_CONDUCT.md"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__external-link"
              >
                Code of Conduct{" "}
                <ExternalLink size={14} className="footer__external-icon" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright */}
      <div className="footer__bottom-bar">
        <div className="footer__copyright">
          &copy; Data Umbrella {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}
