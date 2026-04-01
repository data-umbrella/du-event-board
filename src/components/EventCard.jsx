import { getEventStatus } from "../utils/eventHelpers";

const formatEventDateRange = (startDate, endDate) => {
  if (!startDate && !endDate) return "Date unavailable";

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const startLabel = formatDate(startDate);
  const endLabel = formatDate(endDate);

  if (!startLabel) return "Invalid date";
  if (!endLabel || startLabel === endLabel) return startLabel;
  return `${startLabel} — ${endLabel}`;
};

export default function EventCard({ event }) {
  if (!event) return null;

  const startDate = event.startDate || event.start_date || event.date;
  const endDate = event.endDate || event.end_date || event.date;
  const status = getEventStatus({
    ...event,
    startDate,
    endDate,
  });
  const displayDate = formatEventDateRange(startDate, endDate);
  const displayTime = event.time || "TBA";
  const regionParts = [event.region, event.state, event.country].filter(Boolean);
  const displayLocation = event.location
    ? regionParts.length > 0
      ? `${event.location} • ${regionParts.join(", ")}`
      : event.location
    : regionParts.length > 0
      ? regionParts.join(", ")
      : "TBA";
  const displayType = event.eventType || "in-person";
  const displayCost = event.cost ? event.cost.charAt(0).toUpperCase() + event.cost.slice(1) : "Free";
  const tags = Array.isArray(event.tags) ? event.tags : [];

  const statusMap = {
    live: "status-badge--live",
    upcoming: "status-badge--upcoming",
    ended: "status-badge--ended",
  };

  return (
    <article className="event-card" id={`event-${event.id}`}>
      <div className="event-card__header">
        <span className="event-card__category">{event.category || "General"}</span>

        {status !== "none" && (
          <div
            className={`status-badge ${statusMap[status]}`}
            role="status"
            aria-label={`Event status: ${status === "live" ? "Live Now" : status}`}
          >
            {status === "live" && <span className="live-dot" aria-hidden="true" />}
            {status === "live" ? "Live Now" : status}
          </div>
        )}
      </div>

      {event.organizationLogo && (
        <img
          src={event.organizationLogo}
          alt={`${event.title || "Event"} logo`}
          className="event-card__logo"
        />
      )}

      <h2 className="event-card__title">{event.title || "Untitled event"}</h2>
      <p className="event-card__description">{event.description || "No description available."}</p>

      <div className="event-card__meta">
        <div className="event-card__meta-item">
          <span className="event-card__meta-icon" aria-hidden="true">📅</span>
          <span>{displayDate}</span>
        </div>
        <div className="event-card__meta-item">
          <span className="event-card__meta-icon" aria-hidden="true">🕐</span>
          <span>{displayTime}</span>
        </div>
        <div className="event-card__meta-item">
          <span className="event-card__meta-icon" aria-hidden="true">📍</span>
          <span>{displayLocation}</span>
        </div>
      </div>

      <div className="event-card__chips">
        <span className="event-card__chip">{displayType}</span>
        <span className="event-card__chip">{displayCost}</span>
      </div>

      {tags.length > 0 && (
        <div className="event-card__tags">
          {tags.map((tag) => (
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
          <span className="event-card__link-arrow" aria-hidden="true">→</span>
        </a>
      )}
    </article>
  );
}
