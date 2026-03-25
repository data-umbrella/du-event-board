import { FaGlobe, FaTwitter, FaLinkedin } from "react-icons/fa";

export default function EventCard({ event }) {
  const formattedDate = new Date(event.date + "T00:00:00").toLocaleDateString(
    "en-US",
    {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const hasSocials =
    event.socials &&
    Object.values(event.socials).some(Boolean);

  return (
    <article className="event-card" id={`event-${event.id}`}>
      <span className="event-card__category">{event.category}</span>

      <h2 className="event-card__title">{event.title}</h2>

      <p className="event-card__description">
        {event.description || "No description available."}
      </p>

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
      </div>

      {event.tags && event.tags.length > 0 && (
        <div className="event-card__tags">
          {event.tags.map((tag, index) => (
            <span key={`${tag}-${index}`} className="event-card__tag">
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

        {hasSocials && (
          <div className="event-card__socials">
            {event.socials.website && (
              <a
                href={event.socials.website}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Website"
                title="Website"
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
                title="Twitter"
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
                title="LinkedIn"
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