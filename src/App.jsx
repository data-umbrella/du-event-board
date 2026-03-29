import { useState, useMemo, useEffect } from "react";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import EventCard from "./components/EventCard";
import EventMap from "./components/EventMap";
import Footer from "./components/Footer";
import events from "./data/events.json";
import { useUrlState } from "./hooks/useUrlState";
import {
  parseISODate,
  startOfDay,
  eventOverlapsRange,
} from "./utils/eventHelpers";

function buildUniqueOptions(items) {
  return [...new Set(items.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

export default function App() {
  const [searchTerm, setSearchTerm] = useUrlState("search", "");
  const [selectedCountry, setSelectedCountry] = useUrlState("country", "");
  const [selectedState, setSelectedState] = useUrlState("state", "");
  const [selectedRegion, setSelectedRegion] = useUrlState("region", "");
  const [selectedCategory, setSelectedCategory] = useUrlState("category", "");
  const [selectedTag, setSelectedTag] = useUrlState("tag", "");
  const [selectedEventType, setSelectedEventType] = useUrlState(
    "eventType",
    "",
  );
  const [selectedCost, setSelectedCost] = useUrlState("cost", "");
  const [currentPage, setCurrentPage] = useUrlState("page", "events");
  const [viewMode, setViewMode] = useUrlState("view", "list");

  const [dateFilterType, setDateFilterType] = useUrlState("dateType", "all");
  const [customDate, setCustomDate] = useUrlState("customDate", "");
  const [rangeStart, setRangeStart] = useUrlState("rangeStart", "");
  const [rangeEnd, setRangeEnd] = useUrlState("rangeEnd", "");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const [theme, setTheme] = useState(() => {
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

    if (typeof localStorage !== "undefined" && localStorage.setItem) {
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const handleDateFilterTypeChange = (nextType) => {
    setDateFilterType(nextType);

    // Clear values from date modes that are no longer active.
    if (nextType !== "customDate") {
      setCustomDate("");
    }

    if (nextType !== "customRange") {
      setRangeStart("");
      setRangeEnd("");
    }
  };

  const countries = useMemo(
    () => buildUniqueOptions(events.map((event) => event.country)),
    [],
  );

  const states = useMemo(() => {
    const visibleEvents = selectedCountry
      ? events.filter((event) => event.country === selectedCountry)
      : events;

    return buildUniqueOptions(visibleEvents.map((event) => event.state));
  }, [selectedCountry]);

  const regions = useMemo(() => {
    const visibleEvents = selectedState
      ? events.filter((event) => event.state === selectedState)
      : selectedCountry
        ? events.filter((event) => event.country === selectedCountry)
        : events;

    return buildUniqueOptions(visibleEvents.map((event) => event.region));
  }, [selectedCountry, selectedState]);

  const categories = useMemo(
    () => buildUniqueOptions(events.map((event) => event.category)),
    [],
  );

  const hashtags = useMemo(
    () => buildUniqueOptions(events.flatMap((event) => event.tags || [])),
    [],
  );

  const eventTypes = useMemo(
    () => buildUniqueOptions(events.map((event) => event.event_type)),
    [],
  );

  const costs = useMemo(
    () => buildUniqueOptions(events.map((event) => event.cost)),
    [],
  );

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
      const eventStart = parseISODate(event.start_date || event.date);
      const eventEnd = parseISODate(
        event.end_date || event.start_date || event.date,
      );

      if (!eventStart || !eventEnd) return false;

      const matchesSearch =
        !term ||
        event.title.toLowerCase().includes(term) ||
        event.description.toLowerCase().includes(term) ||
        event.region.toLowerCase().includes(term) ||
        event.state.toLowerCase().includes(term) ||
        event.country.toLowerCase().includes(term) ||
        event.event_type.toLowerCase().includes(term) ||
        event.cost.toLowerCase().includes(term) ||
        (event.tags &&
          event.tags.some((tag) => tag.toLowerCase().includes(term)));

      const matchesCountry =
        !selectedCountry || event.country === selectedCountry;
      const matchesState = !selectedState || event.state === selectedState;
      const matchesRegion = !selectedRegion || event.region === selectedRegion;
      const matchesCategory =
        !selectedCategory || event.category === selectedCategory;
      const matchesTag =
        !selectedTag || (event.tags && event.tags.includes(selectedTag));
      const matchesEventType =
        !selectedEventType || event.event_type === selectedEventType;
      const matchesCost = !selectedCost || event.cost === selectedCost;

      let matchesDate = true;

      switch (dateFilterType) {
        case "upcoming":
          matchesDate = eventEnd >= today;
          break;
        case "thisWeek":
          matchesDate = eventOverlapsRange(event, weekStart, weekEnd);
          break;
        case "thisMonth":
          matchesDate = eventOverlapsRange(event, monthStart, monthEnd);
          break;
        case "customDate":
          matchesDate = selectedCustomDate
            ? eventOverlapsRange(event, selectedCustomDate, selectedCustomDate)
            : true;
          break;
        case "customRange":
          if (
            selectedRangeStart &&
            selectedRangeEnd &&
            selectedRangeStart > selectedRangeEnd
          ) {
            // Keep invalid ranges from accidentally matching everything.
            matchesDate = false;
            break;
          }

          matchesDate = eventOverlapsRange(
            event,
            selectedRangeStart,
            selectedRangeEnd,
          );
          break;
        default:
          matchesDate = true;
      }

      return (
        matchesSearch &&
        matchesCountry &&
        matchesState &&
        matchesRegion &&
        matchesCategory &&
        matchesTag &&
        matchesEventType &&
        matchesCost &&
        matchesDate
      );
    });
  }, [
    searchTerm,
    selectedCountry,
    selectedState,
    selectedRegion,
    selectedCategory,
    selectedTag,
    selectedEventType,
    selectedCost,
    dateFilterType,
    customDate,
    rangeStart,
    rangeEnd,
  ]);

  return (
    <>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigate={setCurrentPage}
      />
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCountry={selectedCountry}
        onCountryChange={(nextCountry) => {
          setSelectedCountry(nextCountry);
          setSelectedState("");
          setSelectedRegion("");
        }}
        selectedState={selectedState}
        onStateChange={(nextState) => {
          setSelectedState(nextState);
          setSelectedRegion("");
        }}
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedTag={selectedTag}
        onTagChange={setSelectedTag}
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
        countries={countries}
        states={states}
        regions={regions}
        categories={categories}
        hashtags={hashtags}
        eventTypes={eventTypes}
        costs={costs}
      />
      <main className="main" id="main-content">
        <section className="results-toolbar" aria-label="Results summary">
          <p className="main__results-info">
            Showing{" "}
            <span className="main__results-count">
              {filteredEvents.length}
            </span>{" "}
            event{filteredEvents.length !== 1 ? "s" : ""}
          </p>

          <div className="view-toggle">
            <button
              type="button"
              className={`view-toggle__button ${
                viewMode === "list" ? "view-toggle__button--active" : ""
              }`}
              onClick={() => setViewMode("list")}
              aria-label="List"
            >
              List
            </button>
            <button
              type="button"
              className={`view-toggle__button ${
                viewMode === "map" ? "view-toggle__button--active" : ""
              }`}
              onClick={() => setViewMode("map")}
              aria-label="Map"
            >
              Map
            </button>
          </div>
        </section>

        {viewMode === "list" ? (
          <div className="events-grid" id="events-grid">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <div className="empty-state" id="empty-state">
                <div className="empty-state__icon">Search</div>
                <h2 className="empty-state__title">No events found</h2>
                <p className="empty-state__description">
                  Try adjusting your search terms or filters to find events
                  near you.
                </p>
              </div>
            )}
          </div>
        ) : (
          <EventMap events={filteredEvents} />
        )}
      </main>
      <Footer onNavigate={setCurrentPage} />
    </>
  );
}
