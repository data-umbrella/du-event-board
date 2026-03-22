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
      <span className="event-card__category">{event.category}</span>
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
        {event.language && (
          <div className="event-card__meta-item">
            <span className="event-card__meta-icon">🌐</span>
            <span>{event.language}</span>
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
