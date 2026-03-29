import { useState, useMemo, useEffect } from "react";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import EventCard from "./components/EventCard";
import EventMap from "./components/EventMap";
import Footer from "./components/Footer";
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
    const unique = [...new Set(events.map((e) => e.region).filter(Boolean))];
    return unique.sort();
  }, []);

  const categories = useMemo(() => {
    const unique = [...new Set(events.map((e) => e.category).filter(Boolean))];
    return unique.sort();
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

      return matchesSearch && matchesRegion && matchesCategory && matchesDate;
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

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedRegion("");
    setSelectedCategory("");
    setDateFilterType("all");
    setCustomDate("");
    setRangeStart("");
    setRangeEnd("");
  };

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
        onClearFilters={handleClearFilters}
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
        ) : (
          <EventMap events={filteredEvents} />
        )}
      </main>
      <Footer onNavigate={setCurrentPage} />
    </>
  );
}
