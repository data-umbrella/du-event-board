import {
  FaGlobe,
  FaTwitter,
  FaInstagram,
  FaDiscord,
  FaSlack,
  FaLinkedin,
} from "react-icons/fa";
import { getEventStatus } from "../utils/eventHelpers";

export default function EventCard({ event }) {
  const status = getEventStatus(event.date);
  const formattedDate = new Date(event.date + "T00:00:00").toLocaleDateString(
    "en-US",
    {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  function getSocialIcon(name) {
    const iconMap = {
      website: <FaGlobe />,
      twitter: <FaTwitter />,
      instagram: <FaInstagram />,
      discord: <FaDiscord />,
      slack: <FaSlack />,
      linkedin: <FaLinkedin />,
    };

    return iconMap[name?.toLowerCase()] || <FaGlobe />;
  }
  const statusMap = {
    live: "status-badge--live",
    upcoming: "status-badge--upcoming",
    ended: "status-badge--ended",
  };

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
          <span className="event-card__meta-icon">📅</span>
          <span>{formattedDate}</span>
        </div>
        <div className="event-card__meta-item">
          <span className="event-card__meta-icon">🕐</span>
          <span>{event.time}</span>
        </div>
        <div className="event-card__meta-item">
          <span className="event-card__meta-icon">📍</span>
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

      <div className="moreInfo">
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

        {event.socials && event.socials.length > 0 && (
          <div className="socialIcons">
            {event.socials.map((social, index) => (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                title={social.name}
              >
                {getSocialIcon(social.name)}
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
