import { useState, useMemo, useEffect } from "react";
import Fuse from "fuse.js";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import EventCard from "./components/EventCard";
import EventMap from "./components/EventMap";
import Footer from "./components/Footer";
import AboutUs from "./components/AboutUs";
import Sponsors from "./components/Sponsors";
import events from "./data/events.json";
import { useUrlState } from "./hooks/useUrlState";
import BackToTop from "./components/BackToTop";

const fuseOptions = {
  keys: [
    { name: "title", weight: 0.9 },
    { name: "tags", weight: 0.7 },
    { name: "description", weight: 0.4 },
  ],
  threshold: 0.3,
  location: 0,
  distance: 100,
  minMatchCharLength: 1,
};

const fuse = new Fuse(events, fuseOptions);

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
  const [currentPage, setCurrentPage] = useUrlState("page", "events");
  const [viewMode, setViewMode] = useUrlState("view", "grid");

  const [dateFilterType, setDateFilterType] = useUrlState("dateType", "all");
  const [customDate, setCustomDate] = useUrlState("customDate", "");
  const [rangeStart, setRangeStart] = useUrlState("rangeStart", "");
  const [rangeEnd, setRangeEnd] = useUrlState("rangeEnd", "");

  const [sortOrder, setSortOrder] = useState("");

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

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedRegion("");
    setSelectedCategory("");
    setDateFilterType("all");
    setCustomDate("");
    setRangeStart("");
    setRangeEnd("");
  };

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

    const baseEvents = (() => {
      if (!term) return events;

      // 1. Exact Substring/Prefix matches always come first
      const exactMatches = events
        .map((event) => {
          let score = 0;
          const title = event.title.toLowerCase();
          const description = event.description.toLowerCase();
          const tags = event.tags
            ? event.tags.map((t) => t.toLowerCase())
            : [];

          if (title.startsWith(term)) score += 100;
          else if (title.includes(term)) score += 50;

          if (tags.some((t) => t.startsWith(term))) score += 30;
          else if (tags.some((t) => t.includes(term))) score += 10;

          if (description.includes(term)) score += 5;

          return { ...event, _score: score };
        })
        .filter((event) => event._score > 0)
        .sort((a, b) => b._score - a._score);

      // 2. Fuzzy matches for longer queries to handle typos
      // Only do fuzzy if term is long enough AND if we didn't find many exact matches
      if (term.length >= 3) {
        const fuzzyResults = fuse
          .search(term)
          .map((r) => r.item)
          .filter((item) => !exactMatches.find((e) => e.id === item.id));

        return [...exactMatches, ...fuzzyResults];
      }

      return exactMatches;
    })();

    return baseEvents.filter((event) => {
      const eventDate = parseISODate(event.date);
      if (!eventDate) return false;

      // Region filter
      const matchesSearch =
      !term ||
      String(event.title || "").toLowerCase().includes(term) ||
      String(event.description || "").toLowerCase().includes(term) ||
      (Array.isArray(event.tags) &&
      event.tags.some((tag) =>
      String(tag).toLowerCase().includes(term)
      ));

      const matchesRegion = !selectedRegion || event.region === selectedRegion;
      const matchesCategory =
        !selectedCategory || event.category === selectedCategory;

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

      return matchesRegion && matchesCategory && matchesDate;
    });
  }, [
    searchTerm,
    selectedRegion,
    selectedCategory,
    dateFilterType,
    customDate,
    rangeStart,
    rangeEnd,
  ]);

  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const dateA = parseISODate(a.date)?.getTime() ?? Infinity;
      const dateB = parseISODate(b.date)?.getTime() ?? Infinity;

      if (sortOrder === "date-asc") return dateA - dateB;
      if (sortOrder === "date-desc") return dateB - dateA;
      if (sortOrder === "name") return a.title.localeCompare(b.title);
      return 0;
    });
  }, [filteredEvents, sortOrder]);

  const groupedEvents = useMemo(() => {
    if (viewMode !== "list") return null;

    const groups = {};
    sortedEvents.forEach((event) => {
      const date = parseISODate(event.date);
      if (!date) return;

      const key = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    });

    return groups;
  }, [sortedEvents, viewMode]);

  return (
    <>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigate={setCurrentPage}
      />

      {currentPage === "events" ? (
        <>
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
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
          />

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
                  {sortedEvents.length}
                </span>{" "}
                event{sortedEvents.length !== 1 ? "s" : ""}
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
                  onClick={() => setViewMode("grid")}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    background:
                      viewMode === "grid"
                        ? "var(--accent-primary)"
                        : "transparent",
                    color: viewMode === "grid" ? "#fff" : "var(--text-muted)",
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
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  Grid
                </button>

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
                      viewMode === "map"
                        ? "var(--accent-primary)"
                        : "transparent",
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
              </div>
            </div>

            {viewMode === "grid" ? (
              <div className="events-grid" id="events-grid">
                {sortedEvents.length > 0 ? (
                  sortedEvents.map((event) => (
                    <EventCard key={event.id} event={event} viewMode="grid" />
                  ))
                ) : (
                  <div className="empty-state" id="empty-state">
                    <div className="empty-state__icon">🔎</div>
                    <h2 className="empty-state__title">No events found</h2>
                    <button
                      onClick={resetFilters}
                      style={{
                        marginTop: "10px",
                        padding: "8px 16px",
                        cursor: "pointer",
                      }}
                    >
                      Reset Filters
                    </button>
                    <p className="empty-state__description">
                      Try adjusting your search terms or filters to find events
                      near you.
                    </p>
                  </div>
                )}
              </div>
            ) : viewMode === "list" ? (
              <div className="events-list" id="events-list">
                {sortedEvents.length > 0 ? (
                  Object.entries(groupedEvents || {}).map(
                    ([month, monthEvents]) => (
                      <div key={month} className="events-list__month-group">
                        <h3 className="events-list__month-heading">{month}</h3>
                        <div className="events-list__month-rows">
                          {monthEvents.map((event) => (
                            <EventCard
                              key={event.id}
                              event={event}
                              viewMode="list"
                            />
                          ))}
                        </div>
                      </div>
                    ),
                  )
                ) : (
                  <div className="empty-state" id="empty-state">
                    <div className="empty-state__icon">🔎</div>
                    <h2 className="empty-state__title">No events found</h2>
                    <button
                      onClick={resetFilters}
                      style={{
                        marginTop: "10px",
                        padding: "8px 16px",
                        cursor: "pointer",
                      }}
                    >
                      Reset Filters
                    </button>
                    <p className="empty-state__description">
                      Try adjusting your search terms or filters to find events
                      near you.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <EventMap events={sortedEvents} />
            )}
          </main>
        </>
      ) : currentPage === "about" ? (
        <AboutUs />
      ) : currentPage === "sponsors" ? (
        <Sponsors />
      ) : null}

      <Footer onNavigate={setCurrentPage} />
      <BackToTop />
    </>
  );
}