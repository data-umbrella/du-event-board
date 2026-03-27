import {
  formatEventDateRange,
  getEventStatus,
} from "../utils/eventHelpers";

function toLabel(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function EventCard({ event }) {
  const status = getEventStatus(
    event.start_date || event.date,
    event.end_date,
  );
  const formattedDate = formatEventDateRange(
    event.start_date || event.date,
    event.end_date,
  );

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

      <div className="event-card__identity">
        {event.organizer_logo && (
          <img
            className="event-card__logo"
            src={event.organizer_logo}
            alt={`${event.organizer_name || event.title} logo`}
          />
        )}

        <div>
          {event.organizer_name && (
            <p className="event-card__organizer">{event.organizer_name}</p>
          )}
          <h2 className="event-card__title">{event.title}</h2>
        </div>
      </div>

      <div className="event-card__pill-row" aria-label="Event metadata">
        <span className="event-card__pill">{toLabel(event.event_type)}</span>
        <span className="event-card__pill event-card__pill--muted">
          {toLabel(event.cost)}
        </span>
      </div>

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
          <span>
            {event.location} • {event.region}, {event.state}, {event.country}
          </span>
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
