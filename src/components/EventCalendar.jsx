import React from "react";

const formatDateLabel = (dateString) => {
  if (!dateString) return "Unknown date";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function EventCalendar({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="empty-state" id="empty-state">
        <div className="empty-state__icon">📆</div>
        <h2 className="empty-state__title">No calendar events found</h2>
        <p className="empty-state__description">
          Adjust your filters to see events on the calendar view.
        </p>
      </div>
    );
  }

  const groups = events.reduce((acc, event) => {
    const dateKey = event.startDate || event.date || "unknown";
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {});

  const sortedDates = Object.keys(groups).sort();

  return (
    <div className="calendar-view" style={{ display: "grid", gap: "1.5rem" }}>
      {sortedDates.map((dateKey) => (
        <section
          key={dateKey}
          style={{
            padding: "1rem",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "24px",
          }}
        >
          <h3 style={{ margin: "0 0 1rem" }}>{formatDateLabel(dateKey)}</h3>
          <div
            style={{
              display: "grid",
              gap: "1rem",
            }}
          >
            {groups[dateKey].map((event) => (
              <article
                key={event.id}
                style={{
                  padding: "1rem",
                  borderRadius: "18px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-muted)",
                }}
              >
                <h4 style={{ margin: "0 0 0.5rem" }}>{event.title}</h4>
                <p style={{ margin: "0 0 0.5rem", color: "var(--text-muted)" }}>
                  {event.time || "TBA"} • {event.location || "Location TBA"}
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "var(--text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {event.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
