import { getEventStatus } from "../utils/eventHelpers";

export default function EventCard({
  event,
  viewMode = "grid",
  onSelectEvent,
}) {
  const status = getEventStatus(event.date);
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formattedDate = formatDate(event.date);
  const formattedEndDate = formatDate(event.end_date);

  const hasEndDate = event.end_date && event.end_date !== event.date;
  const hasTimes = event.start_time && event.end_time;

  let dateDisplay = formattedDate;

  if (hasEndDate) {
    if (hasTimes) {
      dateDisplay = `${formattedDate}, ${event.start_time} – ${formattedEndDate}, ${event.end_time}`;
    } else {
      dateDisplay = `${formattedDate} – ${formattedEndDate}`;
    }
  } else {
    // Single day event
    const timeVal =
      event.time ||
      (event.start_time && event.end_time
        ? `${event.start_time} – ${event.end_time}`
        : event.start_time);
    if (timeVal) {
      dateDisplay = `${formattedDate} • ${timeVal}`;
    }
  }

  const statusMap = {
    live: "status-badge--live",
    upcoming: "status-badge--upcoming",
    ended: "status-badge--ended",
  };

  if (viewMode === "list") {
    return (
      <article className="event-list-row" id={`event-${event.id}`}>
        <div className="event-list-row__title-wrap">
          <a
            href={`?page=event-details&eventId=${event.id}`}
            onClick={(e) => {
              e.preventDefault();
              onSelectEvent(event.id);
            }}
            className="event-list-row__title"
          >
            {event.title}
          </a>
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
          <span className="event-list-row__date">{dateDisplay}</span>
        </div>
      </article>
    );
  }

  // Grid view (default)
  return (
    <article
      className="event-card"
      id={`event-${event.id}`}
      onClick={() => onSelectEvent(event.id)}
      style={{ cursor: "pointer" }}
    >
      <div className="event-card__header">
        <span className="event-card__category">{event.category}</span>

        {status !== "none" && (
          <div className={`status-badge ${statusMap[status]}`}>
            {status === "live" && <span className="live-dot" />}
            {status === "live" ? "Live Now" : status}
          </div>
        )}
      </div>

      <h2 className="event-card__title">
        <a
          href={`?page=event-details&eventId=${event.id}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelectEvent(event.id);
          }}
          style={{ color: "inherit", textDecoration: "none" }}
        >
          {event.title}
        </a>
      </h2>
      <p className="event-card__description">{event.description}</p>

      <div className="event-card__meta">
        <div className="event-card__meta-item">
          <span className="event-card__meta-icon" aria-hidden="true">
            📅
          </span>
          <span>{dateDisplay}</span>
        </div>

        <div className="event-card__meta-item">
          <span className="event-card__meta-icon" aria-hidden="true">
            📍
          </span>
          <span>{event.location}</span>
        </div>

        {event.paid_or_free && (
          <div className="event-card__meta-item">
            <span className="event-card__meta-icon" aria-hidden="true">
              💰
            </span>
            <span>
              {event.paid_or_free.charAt(0).toUpperCase() +
                event.paid_or_free.slice(1)}
            </span>
          </div>
        )}
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
    </article>
  );
}
