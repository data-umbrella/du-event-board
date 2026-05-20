import { getEventStatus } from "../utils/eventHelpers";
import { FaGlobe, FaTwitter, FaLinkedin } from "react-icons/fa";

export default function EventCard({ event, viewMode = "grid" }) {
  const status = getEventStatus(event.date);

  const formattedDate = event.date
    ? new Date(event.date + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date TBD";

  const statusMap = {
    live: "status-badge--live",
    upcoming: "status-badge--upcoming",
    ended: "status-badge--ended",
  };

  const hasSocials =
    event.socials && Object.values(event.socials).some(Boolean);

  // ✅ LIST VIEW
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
              {status === "live"
                ? "Live"
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
          )}

          <span className="event-list-row__date">{formattedDate}</span>
        </div>
      </article>
    );
  }

  // ✅ GRID VIEW
  return (
    <article className="event-card" id={`event-${event.id}`}>
      <div className="event-card__header">
        <span className="event-card__category">{event.category}</span>

        {status !== "none" && (
          <div className={`status-badge ${statusMap[status]}`}>
            {status === "live" && <span className="live-dot" />}
            {status === "live"
              ? "Live Now"
              : status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        )}
      </div>

      <h2 className="event-card__title">{event.title}</h2>

      <p className="event-card__description">
        {event.description || "No description available."}
      </p>

      <div className="event-card__meta">
        {/* Date */}
        <div className="event-card__meta-item">
          <span className="event-card__meta-icon" aria-hidden="true">
            📅
          </span>
          <span>{formattedDate}</span>
        </div>

        {/* Time */}
        <div className="event-card__meta-item">
          <span className="event-card__meta-icon" aria-hidden="true">
            🕐
          </span>
          <span>{event.time || "Time TBD"}</span>
        </div>

        {/* Location */}
        <div className="event-card__meta-item">
          <span className="event-card__meta-icon" aria-hidden="true">
            📍
          </span>
          <span>{event.location || "Location TBD"}</span>
        </div>

        {/* Capacity */}
        <div className="event-card__meta-item">
          <span className="event-card__meta-icon" aria-hidden="true">
            👥
          </span>
          <span>
            {typeof event.capacity === "number"
              ? `${event.capacity} spots`
              : "Unlimited"}
          </span>
        </div>
      </div>

      {/* Tags */}
      {event.tags?.length > 0 && (
        <div className="event-card__tags">
          {event.tags.map((tag, index) => (
            <span key={`${tag}-${index}`} className="event-card__tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="event-card__actions">
        {event.url && (
          <a
            href={event.url}
            className="event-card__link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more <span className="event-card__link-arrow">→</span>
          </a>
        )}

        {hasSocials && (
          <div className="event-card__socials">
            {event.socials.website && (
              <a
                href={event.socials.website}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Website"
                className="event-card__social-link"
              >
                <FaGlobe />
              </a>
            )}

            {event.socials.twitter && (
              <a
                href={event.socials.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="event-card__social-link"
              >
                <FaTwitter />
              </a>
            )}

            {event.socials.linkedin && (
              <a
                href={event.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="event-card__social-link"
              >
                <FaLinkedin />
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
