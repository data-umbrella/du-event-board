import { useParams, Link } from "react-router-dom";
import events from "../data/events.json";
import { getEventStatus } from "../utils/eventHelpers";

export default function EventDetail() {
  const { id } = useParams();

  const event = events.find((e) => String(e.id) === id);

  if (!event) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Event not found</h2>
        <Link to="/">← Back to Events</Link>
      </div>
    );
  }

  const status = getEventStatus(event.date);

  const statusMap = {
    live: "status-badge--live",
    upcoming: "status-badge--upcoming",
    ended: "status-badge--ended",
  };

  const formattedDate =
    event.date && !isNaN(new Date(event.date))
      ? new Date(event.date + "T00:00:00").toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Date TBD";

  return (
    <div style={{ maxWidth: "900px", margin: "2rem auto", padding: "1rem" }}>
      {/* 🔙 Back */}
      <Link
        to="/"
        style={{
          color: "#8b5cf6",
          fontWeight: "bold",
          textDecoration: "none",
        }}
      >
        ← Back to Events
      </Link>

      {/* CARD CONTAINER */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "2rem",
          marginTop: "1rem",
          animation: "fadeInUp 0.4s ease",
        }}
      >
        {/* 🏷️ Title */}
        <h1 style={{ fontSize: "2.4rem" }}>{event.title}</h1>

        {/* 🟣 STATUS BADGE */}
        <span
          className={`status-badge ${statusMap[status] || ""}`}
          style={{ marginTop: "0.5rem", display: "inline-block" }}
        >
          {status.toUpperCase()}
        </span>

        {/* 📅 INFO */}
        <div style={{ marginTop: "1.5rem", lineHeight: "1.8" }}>
          <p>
            📅 <strong>{formattedDate}</strong>
          </p>
          <p>⏰ {event.time}</p>
          <p>📍 {event.location}</p>
        </div>

        {/* 📝 DESCRIPTION */}
        <p style={{ marginTop: "1.5rem", lineHeight: "1.7" }}>
          {event.description}
        </p>

        {/* 🏷️ TAGS */}
        {event.tags?.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            {event.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  marginRight: "8px",
                  padding: "5px 10px",
                  borderRadius: "14px",
                  background: "#1f2937",
                  fontSize: "12px",
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 🔗 CTA BUTTON */}
      </div>
    </div>
  );
}
