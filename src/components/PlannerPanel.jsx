function formatPlannerDate(date, time) {
  const displayDate = new Date(`${date}T00:00:00`);
  const formattedDate = displayDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return time ? `${formattedDate} at ${time}` : formattedDate;
}

export default function PlannerPanel({
  savedEvents,
  onRemoveEvent,
  onClearPlanner,
  onExportPlanner,
}) {
  const hasSavedEvents = savedEvents.length > 0;

  return (
    <section className="planner" aria-labelledby="planner-title">
      <div className="planner__header">
        <div>
          <p className="planner__eyebrow">My Event Planner</p>
          <h2 className="planner__title" id="planner-title">
            Your saved events
          </h2>
          <p className="planner__description">
            Keep a shortlist of events you want to attend and export them to
            your calendar when you are ready.
          </p>
        </div>

        <div className="planner__actions">
          <button
            type="button"
            className="planner__action planner__action--secondary"
            onClick={onClearPlanner}
            disabled={!hasSavedEvents}
          >
            Clear planner
          </button>
          <button
            type="button"
            className="planner__action planner__action--primary"
            onClick={onExportPlanner}
            disabled={!hasSavedEvents}
          >
            Export calendar
          </button>
        </div>
      </div>

      <p className="planner__count">
        {savedEvents.length} saved event{savedEvents.length !== 1 ? "s" : ""}
      </p>

      {hasSavedEvents ? (
        <div className="planner__list" role="list">
          {savedEvents.map((event) => (
            <article className="planner__item" key={event.id} role="listitem">
              <div className="planner__item-content">
                <h3 className="planner__item-title">{event.title}</h3>
                <p className="planner__item-meta">
                  {formatPlannerDate(event.date, event.time)}
                </p>
                <p className="planner__item-meta">{event.location}</p>
              </div>
              <button
                type="button"
                className="planner__remove"
                onClick={() => onRemoveEvent(event.id)}
                aria-label={`Remove ${event.title} from planner`}
              >
                Remove
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="planner__empty">
          <p className="planner__empty-title">No saved events yet</p>
          <p className="planner__empty-description">
            Use the save button on any event card to build your personal event
            plan.
          </p>
        </div>
      )}
    </section>
  );
}
