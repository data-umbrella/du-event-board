import { getEventStatus } from "../utils/eventHelpers";
import { downloadICS } from "../utils/icsGenerator";

export default function EventCard({ event, viewMode = "grid" }) {
  const status = getEventStatus(event.date);
  const formattedDate = new Date(event.date + "T00:00:00").toLocaleDateString(
    "en-US",
    {
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
        <button
          className="event-card__calendar-btn"
          onClick={() => downloadICS(event)}
          aria-label={`Add ${event.title} to calendar`}
          type="button"
        >
          <span className="event-card__calendar-icon">📆</span>
          Add to Calendar
        </button>

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
      </div>
    </article>
  );
}
