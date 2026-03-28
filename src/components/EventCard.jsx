import { FaTwitter, FaLinkedin, FaGlobe } from "react-icons/fa";
import { getEventStatus } from "../utils/eventHelpers.js";

export default function EventCard({ event }) {
  const formattedDate = event.date
    ? new Date(event.date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date TBD";

  const status = getEventStatus(event.date);

  return (
    <article className="event-card" id={`event-${event.id}`}>
      {/* Category + Status */}
      <div className="flex items-center gap-2">
        {event.category && (
          <span className="event-card__category">{event.category}</span>
        )}

        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          • {status.label.toUpperCase()}
        </span>
      </div>

      {/* Title */}
      <h2 className="event-card__title">{event.title}</h2>

      {/* Description */}
      <p className="event-card__description">
        {event.description || "No description available."}
      </p>

      {/* Meta Info */}
      <div className="event-card__meta">
        <div className="event-card__meta-item">
          <span className="event-card__meta-icon">📅</span>
          <span>{formattedDate}</span>
        </div>

        <div className="event-card__meta-item">
          <span className="event-card__meta-icon">🕐</span>
          <span>{event.time || "Time TBD"}</span>
        </div>

        <div className="event-card__meta-item">
          <span className="event-card__meta-icon">📍</span>
          <span>{event.location || "Location TBD"}</span>
        </div>

        <div className="event-card__meta-item">
          <span className="event-card__meta-icon">🎟️</span>
          <span>
            {event.capacity !== undefined
              ? `${event.capacity} spots`
              : "Unlimited"}
          </span>
        </div>
      </div>

      {/* Tags */}
      {event.tags && event.tags.length > 0 && (
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

        {event.socials &&
          (event.socials.website ||
            event.socials.twitter ||
            event.socials.linkedin) && (
            <div className="event-card__socials">
              {event.socials.website && (
                <a
                  href={event.socials.website}
                  target="_blank"
                  rel="noopener noreferrer"
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
