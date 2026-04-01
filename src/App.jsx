import { useState, useMemo, useEffect } from "react";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import EventCard from "./components/EventCard";
import EventMap from "./components/EventMap";
import EventCalendar from "./components/EventCalendar";
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

  const [dateFilterType, setDateFilterType] = useUrlState("dateType", "all");
  const [customDate, setCustomDate] = useUrlState("customDate", "");
  const [rangeStart, setRangeStart] = useUrlState("rangeStart", "");
  const [rangeEnd, setRangeEnd] = useUrlState("rangeEnd", "");
  const [selectedCountry, setSelectedCountry] = useUrlState("country", "");
  const [selectedState, setSelectedState] = useUrlState("state", "");
  const [selectedEventType, setSelectedEventType] = useUrlState("eventType", "");
  const [selectedCost, setSelectedCost] = useUrlState("cost", "");
  const [featuredExpanded, setFeaturedExpanded] = useState(false);

  const [theme, setTheme] = useState(() => {
    // Check if we are in a browser and if localStorage.getItem actually exists
    if (
      typeof window !== "undefined" &&
      window.localStorage &&
      typeof window.localStorage.getItem === "function"
    ) {
      return localStorage.getItem("theme") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }

    // This line "records" the choice in the browser
    if (typeof localStorage !== "undefined" && localStorage.setItem) {
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

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

  const countries = useMemo(() => {
    const unique = [...new Set(events.map((e) => e.country || "Brazil"))];
    return unique.sort();
  }, []);

  const states = useMemo(() => {
    const unique = [...new Set(events.map((e) => e.state || ""))].filter(Boolean);
    return unique.sort();
  }, []);

  const eventTypes = useMemo(() => {
    const unique = [...new Set(events.map((e) => e.eventType || "in-person"))];
    return unique.sort();
  }, []);

  const costOptions = useMemo(() => {
    const unique = [...new Set(events.map((e) => e.cost || "free"))];
    return unique.sort();
  }, []);

  const featuredEvents = useMemo(
    () => events.filter((event) => event.featured),
    [],
  );

  const displayedFeatured = featuredExpanded
    ? featuredEvents
    : featuredEvents.slice(0, 3);

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
      const eventStart = parseISODate(event.startDate || event.date);
      const eventEnd = parseISODate(event.endDate || event.date);
      if (!eventStart || !eventEnd) return false;

      // Text search: title, description, tags
      const matchesSearch =
        !term ||
        event.title.toLowerCase().includes(term) ||
        event.description.toLowerCase().includes(term) ||
        (event.tags &&
          event.tags.some((tag) => tag.toLowerCase().includes(term)));

      // Region filter
      const matchesRegion = !selectedRegion || event.region === selectedRegion;

      // Country filter
      const matchesCountry =
        !selectedCountry ||
        (event.country || "Brazil") === selectedCountry;

      // State/province filter
      const matchesState = !selectedState || event.state === selectedState;

      // Category filter
      const matchesCategory =
        !selectedCategory || event.category === selectedCategory;

      // Event type and cost filters
      const matchesEventType =
        !selectedEventType || event.eventType === selectedEventType;
      const matchesCost = !selectedCost || event.cost === selectedCost;

      // Date filter using event range overlap
      let matchesDate = true;

      switch (dateFilterType) {
        case "upcoming":
          matchesDate = eventEnd >= today;
          break;
        case "thisWeek":
          matchesDate = eventEnd >= weekStart && eventStart <= weekEnd;
          break;
        case "thisMonth":
          matchesDate = eventEnd >= monthStart && eventStart <= monthEnd;
          break;
        case "customDate":
          matchesDate =
            !selectedCustomDate ||
            (eventStart <= selectedCustomDate &&
              eventEnd >= selectedCustomDate);
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

          if (selectedRangeStart && eventEnd < selectedRangeStart) {
            matchesDate = false;
          }

          if (selectedRangeEnd && eventStart > selectedRangeEnd) {
            matchesDate = false;
          }
          break;
        default:
          matchesDate = true;
      }

      return (
        matchesSearch &&
        matchesRegion &&
        matchesCountry &&
        matchesState &&
        matchesCategory &&
        matchesEventType &&
        matchesCost &&
        matchesDate
      );
    });
  }, [
    searchTerm,
    selectedRegion,
    selectedCategory,
    selectedCountry,
    selectedState,
    selectedEventType,
    selectedCost,
    dateFilterType,
    customDate,
    rangeStart,
    rangeEnd,
  ]);

  return (
    <>
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
        selectedState={selectedState}
        onStateChange={setSelectedState}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedEventType={selectedEventType}
        onEventTypeChange={setSelectedEventType}
        selectedCost={selectedCost}
        onCostChange={setSelectedCost}
        dateFilterType={dateFilterType}
        onDateFilterTypeChange={handleDateFilterTypeChange}
        customDate={customDate}
        onCustomDateChange={setCustomDate}
        rangeStart={rangeStart}
        onRangeStartChange={setRangeStart}
        rangeEnd={rangeEnd}
        onRangeEndChange={setRangeEnd}
        regions={regions}
        countries={countries}
        states={states}
        categories={categories}
        eventTypes={eventTypes}
        costOptions={costOptions}
      />
      {featuredEvents.length > 0 && (
        <section className="featured-events" style={{ marginBottom: "2rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>Featured Events</h2>
              <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)" }}>
                Highlighted event suggestions for your next meetup or hackathon.
              </p>
            </div>
            {featuredEvents.length > 3 && (
              <button
                onClick={() => setFeaturedExpanded((prev) => !prev)}
                style={{
                  border: "1px solid var(--border-subtle)",
                  background: "transparent",
                  color: "var(--text)",
                  borderRadius: "999px",
                  padding: "0.6rem 1rem",
                  cursor: "pointer",
                }}
              >
                {featuredExpanded ? "Show less" : `More (${featuredEvents.length})`}
              </button>
            )}
          </div>
          <div className="events-grid" id="featured-events-grid">
            {displayedFeatured.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
      <main className="main" id="main-content">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            paddingLeft: "0.25rem",
          }}
        >
          <p
            className="main__results-info"
            style={{ marginBottom: 0, paddingLeft: 0 }}
          >
            Showing{" "}
            <span className="main__results-count">
              {filteredEvents.length}
            </span>{" "}
            event{filteredEvents.length !== 1 ? "s" : ""}
          </p>

          <div
            className="view-toggle"
            style={{
              display: "flex",
              gap: "0.5rem",
              background: "var(--bg-input)",
              padding: "0.3rem",
              borderRadius: "12px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <button
              onClick={() => setViewMode("list")}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                background:
                  viewMode === "list"
                    ? "var(--accent-primary)"
                    : "transparent",
                color: viewMode === "list" ? "#fff" : "var(--text-muted)",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "bold",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              List
            </button>
            <button
              onClick={() => setViewMode("map")}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                background:
                  viewMode === "map" ? "var(--accent-primary)" : "transparent",
                color: viewMode === "map" ? "#fff" : "var(--text-muted)",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "bold",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
                <line x1="9" y1="3" x2="9" y2="21"></line>
                <line x1="15" y1="3" x2="15" y2="21"></line>
              </svg>
              Map
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                background:
                  viewMode === "calendar"
                    ? "var(--accent-primary)"
                    : "transparent",
                color: viewMode === "calendar" ? "#fff" : "var(--text-muted)",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "bold",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                <line x1="3" y1="10" x2="21" y2="10"></line>
                <line x1="8" y1="4" x2="8" y2="22"></line>
              </svg>
              Calendar
            </button>
          </div>
        </div>

        {viewMode === "list" ? (
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
        ) : viewMode === "map" ? (
          <EventMap events={filteredEvents} />
        ) : (
          <EventCalendar events={filteredEvents} />
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
