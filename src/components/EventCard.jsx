import { useState, useRef, useEffect } from "react";
import { getEventStatus } from "../utils/eventHelpers";

export default function EventCard({ event, viewMode = "grid" }) {
  const [showDirections, setShowDirections] = useState(false);
  const dropdownRef = useRef(null);
  const status = getEventStatus(event.date);
  const formattedDate = new Date(event.date + "T00:00:00").toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDirections(false);
      }
    };

    if (showDirections) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDirections]);

  const handleDirectionClick = (provider) => {
    const address = encodeURIComponent(event.location);
    let url = "";
    if (provider === "google") {
      // Google Maps search API with full address
      url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    } else {
      // Apple Maps: q is the search query, ll helps bias the search near the coordinates
      // We use the full address for q, and lat/lng for ll to ensure Apple Maps finds the right spot
      url = `https://maps.apple.com/?q=${address}&ll=${event.lat},${event.lng}&sll=${event.lat},${event.lng}`;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    setShowDirections(false);
  };

  const statusMap = {
    live: "status-badge--live",
    upcoming: "status-badge--upcoming",
    ended: "status-badge--ended",
  };

  if (viewMode === "list") {
    return (
      <article className="event-list-row" id={`event-${event.id}`}>
        <div className="event-list-row__title-wrap">
          {event.url ? (
            <a
              href={event.url}
              className="event-list-row__title"
              target="_blank"
              rel="noopener noreferrer"
            >
              {event.title}
            </a>
          ) : (
            <span className="event-list-row__title">{event.title}</span>
          )}
        </div>
        <div className="event-list-row__right">
          <span className="event-list-row__category">{event.category}</span>
          {status !== "none" && (
            <div
              className={`status-badge ${statusMap[status]} event-list-row__status`}
            >
              {status === "live" && <span className="live-dot" />}
              {status === "live" ? "Live" : status}
            </div>
          )}
          <span className="event-list-row__date">{formattedDate}</span>

          <div className="event-card__directions" ref={dropdownRef}>
            <button
              className="event-card__directions-btn event-card__directions-btn--icon"
              onClick={() => setShowDirections(!showDirections)}
              aria-label="Get Directions"
              title="Get Directions"
            >
              📍
            </button>
            {showDirections && (
              <div className="event-card__directions-menu event-card__directions-menu--list">
                <button
                  className="event-card__directions-item"
                  onClick={() => handleDirectionClick("google")}
                >
                  <img
                    src="public/google-map-icon.png"
                    alt=""
                    className="event-card__directions-logo"
                  />
                  Google Maps
                </button>
                <button
                  className="event-card__directions-item"
                  onClick={() => handleDirectionClick("apple")}
                >
                  <img
                    src="public/Apple_Maps_Logo.png"
                    alt=""
                    className="event-card__directions-logo"
                  />
                  Apple Maps
                </button>
              </div>
            )}
          </div>
        </div>
      </article>
    );
  }

  // Grid view (default)
  return (
    <article className="event-card" id={`event-${event.id}`}>
      <div className="event-card__header">
        <span className="event-card__category">{event.category}</span>

        {status !== "none" && (
          <div className={`status-badge ${statusMap[status]}`}>
            {status === "live" && <span className="live-dot" />}
            {status === "live" ? "Live Now" : status}
          </div>
        )}
      </div>

      <h2 className="event-card__title">{event.title}</h2>
      <p className="event-card__description">{event.description}</p>

      <div className="event-card__meta">
        <div className="event-card__meta-item">
          <span className="event-card__meta-icon" aria-hidden="true">
            📅
          </span>
          <span>{formattedDate}</span>
        </div>
        <div className="event-card__meta-item">
          <span className="event-card__meta-icon" aria-hidden="true">
            🕐
          </span>
          <span>{event.time}</span>
        </div>
        <div className="event-card__meta-item">
          <span className="event-card__meta-icon" aria-hidden="true">
            📍
          </span>
          <span>{event.location}</span>
        </div>
      </div>

      {event.tags && event.tags.length > 0 && (
        <div className="event-card__tags">
          {event.tags.map((tag) => (
            <span key={tag} className="event-card__tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="event-card__actions">
        {event.url && (
          <a
            href={event.url}
            className="event-card__link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more
            <span className="event-card__link-arrow">→</span>
          </a>
        )}

        <div className="event-card__directions" ref={dropdownRef}>
          <button
            className="event-card__directions-btn"
            onClick={() => setShowDirections(!showDirections)}
          >
            Get Directions
            <span
              className={`event-card__directions-arrow ${showDirections ? "open" : ""}`}
            >
              ▾
            </span>
          </button>
          {showDirections && (
            <div className="event-card__directions-menu">
              <button
                className="event-card__directions-item"
                onClick={() => handleDirectionClick("google")}
              >
                <img
                  src="public/google-map-icon.png"
                  alt=""
                  className="event-card__directions-logo"
                />
                Google Maps
              </button>
              <button
                className="event-card__directions-item"
                onClick={() => handleDirectionClick("apple")}
              >
                <img
                  src="public/Apple_Maps_Logo.png"
                  alt=""
                  className="event-card__directions-logo"
                />
                Apple Maps
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
