import { getEventStatus } from "../utils/eventHelpers";

const FORMAT_CONFIG = {
  "in-person": { label: "In-Person", icon: "📍" },
  online: { label: "Online", icon: "🌐" },
  hybrid: { label: "Hybrid", icon: "🔀" },
};

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

  const statusMap = {
    live: "status-badge--live",
    upcoming: "status-badge--upcoming",
    ended: "status-badge--ended",
  };

  const formatInfo = event.format ? FORMAT_CONFIG[event.format] : null;

  return (
    <article className="event-card" id={`event-${event.id}`}>
      <div className="event-card__header">
        <span className="event-card__category">{event.category}</span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {formatInfo && (
            <span
              className={`event-card__format-badge event-card__format-badge--${event.format}`}
            >
              {formatInfo.icon} {formatInfo.label}
            </span>
          )}
          {status !== "none" && (
            <div className={`status-badge ${statusMap[status]}`}>
              {status === "live" && <span className="live-dot" />}
              {status === "live" ? "Live Now" : status}
            </div>
          )}
        </div>
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
    </article>
  );
}
