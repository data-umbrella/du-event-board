import { getEventStatus } from "../utils/eventHelpers";

export default function EventCard({ event }) {
  const status = getEventStatus(event.date);

  const formattedDate = event.date
    ? new Date(event.date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short",
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

        <div className="event-card__meta-item">
          <span className="event-card__meta-icon">🎟️</span>
          <span>
            {event.capacity !== undefined
              ? `${event.capacity} spots`
              : "Unlimited"}
          </span>
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
    </article>
  );
}