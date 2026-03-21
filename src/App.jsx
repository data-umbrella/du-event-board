import { useState, useMemo, useEffect } from "react";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import EventCard from "./components/EventCard";
import events from "./data/events.json";

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
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });

  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }

    // This line "records" the choice in the browser
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [dateFilterType, setDateFilterType] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

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

  return (
    <>
      <Header theme={theme} onToggleTheme={toggleTheme} />
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
      />
      <main className="main" id="main-content">
        <p className="main__results-info">
          Showing{" "}
          <span className="main__results-count">{filteredEvents.length}</span>{" "}
          event{filteredEvents.length !== 1 ? "s" : ""}
        </p>
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
                Try adjusting your search terms or filters to find events near
                you.
              </p>
            </div>
          )}
        </div>
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
