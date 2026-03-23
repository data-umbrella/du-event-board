import { useBookmarks } from "../hooks/useBookmarks";
import EventCard from "./EventCard";

export default function SavedEvents({ allEvents }) {
  const { bookmarks } = useBookmarks();

  // Filter the original events list to only include bookmarked IDs
  const savedList = allEvents.filter((event) => bookmarks.includes(event.id));

  return (
    <section className="saved-events">
      {/* Optional: Add a title for the saved section */}
      <h2
        style={{
          marginBottom: "1.5rem",
          fontSize: "1.5rem",
          fontWeight: "bold",
        }}
      >
        {savedList.length > 0 ? "Your Saved Events" : ""}
      </h2>

      {savedList.length > 0 ? (
        <div className="events-grid">
          {savedList.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        /* Using your existing CSS classes here */
        <div className="empty-state">
          <div className="empty-state__icon">❤️</div>
          <h2 className="empty-state__title">No saved events yet</h2>
          <p className="empty-state__description">
            Click the heart icon on any event card to save it here so you can
            find it later!
          </p>
        </div>
      )}
    </section>
  );
}
