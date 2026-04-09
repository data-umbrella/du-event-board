import { getEventStatus } from "../utils/eventHelpers";
import { Link } from "react-router-dom";

export default function EventCard({ event, viewMode = "grid" }) {
  const status = getEventStatus(event.date);

  // ✅ Safe date formatting
  const formattedDate =
    event.date && !isNaN(new Date(event.date))
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

  // ======================
  // LIST VIEW (CLICKABLE)
  // ======================
  if (viewMode === "list") {
    return (
      <Link
        to={`/event/${event.id}`}
        style={{ textDecoration: "none", color: "inherit" }}
        aria-label={`View details for ${event.title}`}
      >
        <article className="event-list-row" id={`event-${event.id}`}>
          <div className="event-list-row__title-wrap">
            <span className="event-list-row__title">{event.title}</span>
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
      </Link>
    );
  }

  // ======================
  // GRID VIEW
  // ======================
  return (
    <Link
      to={`/event/${event.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
      aria-label={`View details for ${event.title}`}
    >
      <article className="event-card" id={`event-${event.id}`}>
        {/* Header */}
        <div className="event-card__header">
          <span className="event-card__category">{event.category}</span>

          {status !== "none" && (
            <div className={`status-badge ${statusMap[status]}`}>
              {status === "live" && <span className="live-dot" />}
              {status === "live" ? "Live Now" : status}
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="event-card__title">{event.title}</h2>

        {/* Description */}
        <p className="event-card__description">
          {event.description || "No description available."}
        </p>

        {/* Meta */}
        <div className="event-card__meta">
          <div className="event-card__meta-item">📅 {formattedDate}</div>
          <div className="event-card__meta-item">
            🕐 {event.time || "Time TBD"}
          </div>
          <div className="event-card__meta-item">
            📍 {event.location || "Location TBD"}
          </div>
        </div>

        {/* Tags */}
        {event.tags?.length > 0 && (
          <div className="event-card__tags">
            {event.tags.map((tag) => (
              <span key={tag} className="event-card__tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </Link>
  );
}
