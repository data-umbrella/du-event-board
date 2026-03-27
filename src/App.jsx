import { useState, useMemo } from "react";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import EventCard from "./components/EventCard";
import EventMap from "./components/EventMap";
import events from "./data/events.json";
import { useUrlState } from "./hooks/useUrlState";

function parseISODate(dateString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function startOfDay(date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export default function App() {
  const [searchTerm, setSearchTerm] = useUrlState("search", "");
  const [selectedRegion, setSelectedRegion] = useUrlState("region", "");
  const [selectedCategory, setSelectedCategory] = useUrlState("category", "");
  const [viewMode, setViewMode] = useUrlState("view", "list");
  const [selectedTag, setSelectedTag] = useState("");

  const [dateFilterType, setDateFilterType] = useUrlState("dateType", "all");
  const [customDate, setCustomDate] = useUrlState("customDate", "");
  const [rangeStart, setRangeStart] = useUrlState("rangeStart", "");
  const [rangeEnd, setRangeEnd] = useUrlState("rangeEnd", "");

  const handleDateFilterTypeChange = (nextType) => {
    setDateFilterType(nextType);

    if (nextType !== "customDate") {
      setCustomDate("");
    }

    if (nextType !== "customRange") {
      setRangeStart("");
      setRangeEnd("");
    }
  };

  const regions = useMemo(() => {
    const unique = [...new Set(events.map((e) => e.region))];
    return unique.sort();
  }, []);

  const categories = useMemo(() => {
    const unique = [...new Set(events.map((e) => e.category))];
    return unique.sort();
  }, []);

  const tags = useMemo(() => {
    const unique = new Set();
    events.forEach((event) => {
      if (Array.isArray(event.tags)) {
        event.tags.forEach((tag) => unique.add(tag));
      }
    });
    return [...unique].sort((a, b) => a.localeCompare(b));
  }, []);

  const filteredEvents = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    const today = startOfDay(new Date());

    const weekStart = new Date(today);
    const dayIndex = (today.getDay() + 6) % 7;
    weekStart.setDate(today.getDate() - dayIndex);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    monthEnd.setHours(0, 0, 0, 0);

    const selectedCustomDate = parseISODate(customDate);
    const selectedRangeStart = parseISODate(rangeStart);
    const selectedRangeEnd = parseISODate(rangeEnd);

    return events.filter((event) => {
      const eventDate = parseISODate(event.date);
      if (!eventDate) return false;

      // Text search: title, description, tags
      const matchesSearch =
        !term ||
        event.title.toLowerCase().includes(term) ||
        event.description.toLowerCase().includes(term) ||
        (event.tags &&
          event.tags.some((tag) => tag.toLowerCase().includes(term)));

      // Region filter
      const matchesRegion = !selectedRegion || event.region === selectedRegion;

      // Category filter
      const matchesCategory =
        !selectedCategory || event.category === selectedCategory;

      const matchesTag =
        !selectedTag ||
        (event.tags && event.tags.some((tag) => tag === selectedTag));

      // Date filter
      let matchesDate = true;

      switch (dateFilterType) {
        case "upcoming":
          matchesDate = eventDate >= today;
          break;
        case "thisWeek":
          matchesDate = eventDate >= weekStart && eventDate <= weekEnd;
          break;
        case "thisMonth":
          matchesDate = eventDate >= monthStart && eventDate <= monthEnd;
          break;
        case "customDate":
          matchesDate =
            !selectedCustomDate ||
            eventDate.getTime() === selectedCustomDate.getTime();
          break;
        case "customRange":
          if (
            selectedRangeStart &&
            selectedRangeEnd &&
            selectedRangeStart > selectedRangeEnd
          ) {
            matchesDate = false;
            break;
          }

          if (selectedRangeStart && eventDate < selectedRangeStart) {
            matchesDate = false;
          }

          if (selectedRangeEnd && eventDate > selectedRangeEnd) {
            matchesDate = false;
          }
          break;
        default:
          matchesDate = true;
      }

      return (
        matchesSearch &&
        matchesRegion &&
        matchesCategory &&
        matchesTag &&
        matchesDate
      );
    });
  }, [
    searchTerm,
    selectedRegion,
    selectedCategory,
    selectedTag,
    dateFilterType,
    customDate,
    rangeStart,
    rangeEnd,
  ]);

  const monthGroups = useMemo(() => {
    const sorted = [...filteredEvents].sort(
      (a, b) => parseISODate(a.date) - parseISODate(b.date),
    );

    return sorted.reduce((groups, event) => {
      const eventDate = parseISODate(event.date);
      const key = `${eventDate.getFullYear()}-${eventDate.getMonth()}`;
      const monthLabel = eventDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      const existing = groups.find((group) => group.key === key);
      if (existing) {
        existing.events.push(event);
      } else {
        groups.push({ key, label: monthLabel, events: [event] });
      }

      return groups;
    }, []);
  }, [filteredEvents]);

  return (
    <>
      <Header />
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        dateFilterType={dateFilterType}
        onDateFilterTypeChange={handleDateFilterTypeChange}
        customDate={customDate}
        onCustomDateChange={setCustomDate}
        rangeStart={rangeStart}
        onRangeStartChange={setRangeStart}
        rangeEnd={rangeEnd}
        onRangeEndChange={setRangeEnd}
        regions={regions}
        categories={categories}
        tags={tags}
        selectedTag={selectedTag}
        onTagChange={setSelectedTag}
      />
      <main className="main" id="main-content">
        <div className="results-header">
          <div className="results-header__left">
            <h2 className="results-header__title">Search Results</h2>
            <p className="main__results-info">
              Showing{" "}
              <span className="main__results-count">{filteredEvents.length}</span>{" "}
              event{filteredEvents.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="view-toggle view-toggle--screenshot">
            <button
              onClick={() => setViewMode("grid")}
              aria-pressed={viewMode === "grid"}
              aria-label="Grid view"
              className={`view-toggle__button ${
                viewMode === "grid" ? "view-toggle__button--active" : ""
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              aria-label="List view"
              className={`view-toggle__button ${
                viewMode === "list" ? "view-toggle__button--active" : ""
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              aria-pressed={viewMode === "calendar"}
              aria-label="Calendar view"
              className={`view-toggle__button ${
                viewMode === "calendar" ? "view-toggle__button--active" : ""
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode("map")}
              aria-pressed={viewMode === "map"}
              aria-label="Map view"
              className={`view-toggle__button ${
                viewMode === "map" ? "view-toggle__button--active" : ""
              }`}
            >
              Map
            </button>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="events-grid" id="events-grid">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <div className="empty-state" id="empty-state">
                <div className="empty-state__icon">🔎</div>
                <h2 className="empty-state__title">No events found</h2>
                <p className="empty-state__description">
                  Try adjusting your search terms or filters to find events
                  near you.
                </p>
              </div>
            )}
          </div>
        ) : viewMode === "list" ? (
          <div className="events-grid events-list" id="events-grid">
            {filteredEvents.length > 0 ? (
              monthGroups.map((group) => (
                <section key={group.key} className="events-list__month-group">
                  <h2 className="events-list__month-title">{group.label}</h2>
                  <div className="events-list__rows">
                    {group.events.map((event) => (
                      <EventCard key={event.id} event={event} viewMode="list" />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="empty-state" id="empty-state">
                <div className="empty-state__icon">🔎</div>
                <h2 className="empty-state__title">No events found</h2>
                <p className="empty-state__description">
                  Try adjusting your search terms or filters to find events
                  near you.
                </p>
              </div>
            )}
          </div>
        ) : viewMode === "calendar" ? (
          <div className="calendar-view" id="calendar-view">
            {monthGroups.map((group) => (
              <section key={group.key} className="calendar-view__month">
                <h2 className="calendar-view__month-title">{group.label}</h2>
                <div className="calendar-view__events">
                  {group.events.map((event) => (
                    <article key={event.id} className="calendar-view__event">
                      <span className="calendar-view__event-date">
                        {new Date(event.date + "T00:00:00").toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </span>
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="calendar-view__event-link"
                      >
                        {event.title}
                      </a>
                      <span className="calendar-view__event-badge">
                        {event.category}
                      </span>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EventMap events={filteredEvents} />
        )}
      </main>
      <footer className="footer">
        <p>
          DU Event Board — Built with ❤️ by the community.{" "}
          <a
            href="https://github.com/osl-incubator/du-event-board"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contribute on GitHub
          </a>
        </p>
      </footer>
    </>
  );
}
