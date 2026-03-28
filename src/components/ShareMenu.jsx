// This component renders a share icon button for upcoming events.
// LinkedIn, X, WhatsApp, and Copy Link.

import { useState, useRef, useEffect } from "react";

// ─── Platform SVG Icons ───────────────────────────────────────────────────────

function ShareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── ShareMenu Component ──────────────────────────────────────────────────────

export default function ShareMenu({ event }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef(null);

  // Close panel when clicking outside of it
  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  // Close panel on Escape key
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  // Prefer event.url; fall back to current page URL
  const eventUrl = event.url || window.location.href;

  // Pre-drafted message used across platforms
  const draftMessage =
    `📅 ${event.title}\n` +
    `🗓 ${event.date}${event.time ? ` at ${event.time}` : ""}\n` +
    `📍 ${event.location}\n\n` +
    `Check it out: ${eventUrl}`;

  const handleShare = (platform) => {
    const encodedUrl = encodeURIComponent(eventUrl);
    const encodedMessage = encodeURIComponent(draftMessage);
    const encodedTitle = encodeURIComponent(event.title);
    const encodedSummary = encodeURIComponent(
      `📅 ${event.title} — ${event.date}${event.time ? ` at ${event.time}` : ""} — ${event.location}`,
    );

    switch (platform) {
      case "x":
        // Opens X (Twitter) intent URL with pre-filled tweet text.
        // Works on all platforms via browser redirect.
        window.open(
          `https://twitter.com/intent/tweet?text=${encodedMessage}`,
          "_blank",
          "noopener,noreferrer,width=600,height=400",
        );
        setOpen(false);
        break;

      case "whatsapp":
        // wa.me is WhatsApp's universal share link:
        // - On mobile (iOS/Android): opens the WhatsApp app with contact/group picker
        // - On desktop (macOS/Windows): opens WhatsApp Desktop or web.whatsapp.com
        // - On web: opens web.whatsapp.com
        // The drafted message is pre-filled; user picks recipients themselves.
        window.open(
          `https://wa.me/?text=${encodedMessage}`,
          "_blank",
          "noopener,noreferrer",
        );
        setOpen(false);
        break;

      case "linkedin":
        // Opens LinkedIn's share composer with pre-filled URL, title, and summary.
        // Works on all platforms via browser redirect.
        window.open(
          `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedSummary}`,
          "_blank",
          "noopener,noreferrer,width=600,height=600",
        );

        alert(
          "LinkedIn does not allow pre-filled post content. Copy event details manually if needed.",
        );
        setOpen(false);
        break;

      case "copy":
        // Clipboard API with execCommand fallback for older/restricted browsers
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(eventUrl).then(() => {
            setCopied(true);
            setTimeout(() => {
              setCopied(false);
              setOpen(false);
            }, 1500);
          });
        } else {
          // Fallback: create a temporary textarea and use execCommand
          const textarea = document.createElement("textarea");
          textarea.value = eventUrl;
          textarea.setAttribute("readonly", "");
          textarea.style.cssText =
            "position:absolute;left:-9999px;top:-9999px;";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
            setOpen(false);
          }, 1500);
        }
        break;
    }
  };

  return (
    <div className="share-menu" ref={containerRef}>
      {/* Trigger button — ghost icon button pinned to top-right of the card */}
      <button
        className="share-menu__trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Share this event"
        aria-expanded={open}
        aria-haspopup="true"
        title="Share this event"
      >
        <ShareIcon />
      </button>

      {/* Share panel — Instagram-style row of circular platform icons */}
      {open && (
        <div
          className="share-menu__panel"
          role="menu"
          aria-label="Share options"
        >
          <p className="share-menu__heading">Share event</p>

          <div className="share-menu__options">
            <button
              className="share-menu__option"
              onClick={() => handleShare("x")}
              role="menuitem"
            >
              <span className="share-menu__option-icon share-menu__option-icon--x">
                <XIcon />
              </span>
              <span className="share-menu__option-label">X</span>
            </button>

            <button
              className="share-menu__option"
              onClick={() => handleShare("whatsapp")}
              role="menuitem"
            >
              <span className="share-menu__option-icon share-menu__option-icon--whatsapp">
                <WhatsAppIcon />
              </span>
              <span className="share-menu__option-label">WhatsApp</span>
            </button>

            <button
              className="share-menu__option"
              onClick={() => handleShare("linkedin")}
              role="menuitem"
            >
              <span className="share-menu__option-icon share-menu__option-icon--linkedin">
                <LinkedInIcon />
              </span>
              <span className="share-menu__option-label">LinkedIn</span>
            </button>

            <button
              className="share-menu__option"
              onClick={() => handleShare("copy")}
              role="menuitem"
            >
              <span
                className={`share-menu__option-icon share-menu__option-icon--copy${copied ? " share-menu__option-icon--copied" : ""}`}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </span>
              <span className="share-menu__option-label">
                {copied ? "Copied!" : "Copy Link"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
