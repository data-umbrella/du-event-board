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

  return (
    <article className="event-card" id={`event-${event.id}`}>
      {event.category && (
        <span className="event-card__category">{event.category}</span>
      )}
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
        {event.capacity ? (
          <div className="event-card__meta-item">
            <span className="event-card__meta-icon">🎟️</span>
            <span>{event.capacity} spots</span>
          </div>
        ) : (
          <div className="event-card__meta-item">
            <span className="event-card__meta-icon">🎟️</span>
            <span>Unlimited</span>
          </div>
        )}
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
      </div>
    </article>
  );
}
