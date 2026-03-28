import { getEventStatus } from "../utils/eventHelpers";

export default function EventCard({
  event,
  joinEvent,
  cancelEvent,
  isJoined,
}) {
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
      <div className={"event-card__footer"}>
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

        {status !== "ended" && (
          <div className="event-card__join">
            {isJoined(event.id) && (
              <span className="event-card__joined-marker"> ✓ joined</span>
            )}
            <button
              type="button"
              className={`event-card__join-button ${isJoined(event.id) ? "joined" : ""}`}
              onClick={(e) => {
                e.stopPropagation();

                if (isJoined(event.id)) {
                  cancelEvent(event.id);
                } else {
                  joinEvent(event.id);
                }
              }}
            >
              {isJoined(event.id) ? "Cancel" : "Join event"}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
