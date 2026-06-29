import { useState, useMemo, useEffect } from "react";
import Fuse from "fuse.js";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import EventCard from "./components/EventCard";
import EventMap from "./components/EventMap";
import Footer from "./components/Footer";
import AboutUs from "./components/AboutUs";
import Sponsors from "./components/Sponsors";
import EventDetails from "./components/EventDetails";
import events from "./data/events.json";
import { useUrlState } from "./hooks/useUrlState";
import BackToTop from "./components/BackToTop";

const fuseOptions = {
  keys: [
    { name: "title", weight: 0.9 },
    { name: "tags", weight: 0.7 },
    { name: "category", weight: 0.6 },
    { name: "city", weight: 0.5 },
    { name: "state", weight: 0.5 },
    { name: "country", weight: 0.5 },
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
  const datePart = dateString.split("T")[0].split(" ")[0];
  const [year, month, day] = datePart.split("-").map(Number);
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
  const [selectedEventId, setSelectedEventId] = useUrlState("eventId", "");
  const [viewMode, setViewMode] = useUrlState("view", "grid");

  const [dateFilterType, setDateFilterType] = useUrlState("dateType", "all");
  const [customDate, setCustomDate] = useUrlState("customDate", "");
  const [rangeStart, setRangeStart] = useUrlState("rangeStart", "");
  const [rangeEnd, setRangeEnd] = useUrlState("rangeEnd", "");

  const [selectedCity, setSelectedCity] = useUrlState("city", "");
  const [selectedState, setSelectedState] = useUrlState("state", "");
  const [selectedCountry, setSelectedCountry] = useUrlState("country", "");
  const [selectedFormat, setSelectedFormat] = useUrlState("format", "");
  const [selectedCost, setSelectedCost] = useUrlState("cost", "");

  const handleCityChange = (city) => {
    setSelectedCity(city);
    if (city) {
      const match = events.find((e) => e.city === city);
      if (match) {
        if (match.state || match.province)
          setSelectedState(match.state || match.province);
        if (match.country) setSelectedCountry(match.country);
        if (match.region) setSelectedRegion(match.region);
      }
    }
  };

  const handleStateChange = (state) => {
    setSelectedState(state);
    if (state) {
      const match = events.find((e) => (e.state || e.province) === state);
      if (match) {
        if (match.country) setSelectedCountry(match.country);
        if (match.region) setSelectedRegion(match.region);
      }
    }
  };

  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    if (country) {
      const match = events.find((e) => e.country === country);
      if (match) {
        if (match.region) setSelectedRegion(match.region);
      }
    }
  };

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find((e) => String(e.id) === String(selectedEventId));
  }, [selectedEventId]);

  useEffect(() => {
    if (currentPage === "event-details" && !selectedEvent) {
      setCurrentPage("events");
    }
  }, [currentPage, selectedEvent, setCurrentPage]);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    if (page !== "event-details") {
      setSelectedEventId("");
    }
  };

  const handleSelectEvent = (eventId) => {
    setSelectedEventId(eventId);
    setCurrentPage("event-details");
  };

  useEffect(() => {
    window.scrollTo(0, 0);
        main
    if (typeof window.gtag !== "undefined") {
      window.gtag("event", "page_view", {
        page_path: `/?page=${currentPage}`,
        page_title:
          currentPage === "events"
            ? "Events"
            : currentPage === "about"
              ? "About"
              : "Sponsors",
      });
    }
  }, [currentPage]);


    // 1. Update Document Title dynamically for any page added now or in the future
    let newTitle = "DU Event Board - Discover Events Near You";

    if (currentPage === "event-details" && selectedEvent) {
      newTitle = `${selectedEvent.title} | DU Event Board`;
    } else if (currentPage && currentPage !== "events") {
      // Auto-formats "about-us" to "About Us" or "sponsors" to "Sponsors"
      const formattedPage = currentPage
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      newTitle = `${formattedPage} | DU Event Board`;
    }

    document.title = newTitle;

    // 2. Explicitly tell Google Analytics that the page has changed
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [currentPage, selectedEvent]);
       main

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

  const countries = useMemo(() => {
    let filtered = events;
    if (selectedRegion) {
      filtered = filtered.filter((e) => e.region === selectedRegion);
    }
    const unique = [
      ...new Set(filtered.map((e) => e.country).filter(Boolean)),
    ];
    return unique.sort();
  }, [selectedRegion]);

  const states = useMemo(() => {
    let filtered = events;
    if (selectedRegion) {
      filtered = filtered.filter((e) => e.region === selectedRegion);
    }
    if (selectedCountry) {
      filtered = filtered.filter((e) => e.country === selectedCountry);
    }
    const unique = [
      ...new Set(filtered.map((e) => e.state || e.province).filter(Boolean)),
    ];
    return unique.sort();
  }, [selectedRegion, selectedCountry]);

  const cities = useMemo(() => {
    let filtered = events;
    if (selectedRegion) {
      filtered = filtered.filter((e) => e.region === selectedRegion);
    }
    if (selectedCountry) {
      filtered = filtered.filter((e) => e.country === selectedCountry);
    }
    if (selectedState) {
      filtered = filtered.filter(
        (e) => (e.state || e.province) === selectedState,
      );
    }
    const unique = [...new Set(filtered.map((e) => e.city).filter(Boolean))];
    return unique.sort();
  }, [selectedRegion, selectedCountry, selectedState]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedRegion("");
    setSelectedCategory("");
    setDateFilterType("all");
    setCustomDate("");
    setRangeStart("");
    setRangeEnd("");
    setSelectedCity("");
    setSelectedState("");
    setSelectedCountry("");
    setSelectedFormat("");
    setSelectedCost("");
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

      let searchDate = parseISODate(term);
      if (!searchDate && term.length >= 6) {
        const d = new Date(term);
        if (!isNaN(d.getTime())) {
          searchDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        }
      }

      // 1. Exact Substring/Prefix matches always come first
      const exactMatches = events
        .map((event) => {
          let score = 0;
          const title = event.title ? event.title.toLowerCase() : "";
          const description = event.description
            ? event.description.toLowerCase()
            : "";
          const tags = event.tags
            ? event.tags.map((t) => t.toLowerCase())
            : [];
          const category = event.category ? event.category.toLowerCase() : "";
          const city = event.city ? event.city.toLowerCase() : "";
          const state = event.state
            ? event.state.toLowerCase()
            : event.province
              ? event.province.toLowerCase()
              : "";
          const country = event.country ? event.country.toLowerCase() : "";

          // Full phrase matches
          if (title.startsWith(term)) score += 100;
          else if (title.includes(term)) score += 50;

          if (tags.some((t) => t.startsWith(term))) score += 30;
          else if (tags.some((t) => t.includes(term))) score += 10;

          if (description.includes(term)) score += 5;

          // Multi-term logic (OR logic across any field, ranking by match count)
          const terms = term.split(/\s+/).filter(Boolean);
          if (terms.length > 1) {
            let matchCount = 0;
            for (const t of terms) {
              let termMatched = false;
              if (title.includes(t)) {
                score += 20;
                termMatched = true;
              } else if (tags.some((tag) => tag.includes(t))) {
                score += 15;
                termMatched = true;
              } else if (category.includes(t)) {
                score += 10;
                termMatched = true;
              } else if (
                city.includes(t) ||
                state.includes(t) ||
                country.includes(t)
              ) {
                score += 10;
                termMatched = true;
              } else if (description.includes(t)) {
                score += 5;
                termMatched = true;
              }

              if (termMatched) {
                matchCount++;
              }
            }

            if (matchCount === terms.length) {
              score += 75; // Big boost for matching all terms!
            } else if (matchCount > 0) {
              score += matchCount * 10; // Bonus for each additional term matched
            }
          }

          if (searchDate) {
            const startDate = parseISODate(event.date || event.start_date);
            const endDate =
              parseISODate(event.end_date || event.endDate) || startDate;
            if (
              startDate &&
              endDate &&
              startDate <= searchDate &&
              endDate >= searchDate
            ) {
              score += 100;
            }
          }

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
      const startDate = parseISODate(event.date || event.start_date);
      const endDate =
        parseISODate(event.end_date || event.endDate) || startDate;
      if (!startDate) return false;

      // Region filter
      const matchesRegion = !selectedRegion || event.region === selectedRegion;

      // Category filter
      const matchesCategory =
        !selectedCategory || event.category === selectedCategory;

      // Date filter
      let matchesDate = true;

      switch (dateFilterType) {
        case "upcoming":
          matchesDate = endDate >= today;
          break;
        case "thisWeek":
          matchesDate = startDate <= weekEnd && endDate >= weekStart;
          break;
        case "thisMonth":
          matchesDate = startDate <= monthEnd && endDate >= monthStart;
          break;
        case "customDate":
          if (!selectedCustomDate) {
            matchesDate = true;
          } else {
            matchesDate =
              startDate <= selectedCustomDate && endDate >= selectedCustomDate;
          }
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

          if (selectedRangeStart && endDate < selectedRangeStart) {
            matchesDate = false;
          }

          if (selectedRangeEnd && startDate > selectedRangeEnd) {
            matchesDate = false;
          }
          break;
        default:
          matchesDate = true;
      }

      // Location filters
      const matchesCity = !selectedCity || event.city === selectedCity;
      const matchesState =
        !selectedState ||
        event.state === selectedState ||
        event.province === selectedState;
      const matchesCountry =
        !selectedCountry || event.country === selectedCountry;

      // Format filter
      let matchesFormat = true;
      if (selectedFormat) {
        const isHybrid = event.in_person === "Yes" && event.virtual === "Yes";
        const isOnline =
          event.virtual === "Yes" ||
          (event.location && event.location.toLowerCase() === "online");
        const isInPerson = event.in_person === "Yes";

        if (selectedFormat === "hybrid") matchesFormat = isHybrid;
        else if (selectedFormat === "online")
          matchesFormat = isOnline && !isHybrid;
        else if (selectedFormat === "in-person")
          matchesFormat = isInPerson && !isHybrid;
      }

      // Cost filter
      let matchesCost = true;
      if (selectedCost) {
        const costVal = event.paid_or_free
          ? event.paid_or_free.toLowerCase()
          : "";
        if (selectedCost === "free") matchesCost = costVal === "free";
        else if (selectedCost === "paid") matchesCost = costVal === "paid";
      }

      return (
        matchesRegion &&
        matchesCategory &&
        matchesDate &&
        matchesCity &&
        matchesState &&
        matchesCountry &&
        matchesFormat &&
        matchesCost
      );
    });
  }, [
    searchTerm,
    selectedRegion,
    selectedCategory,
    dateFilterType,
    customDate,
    rangeStart,
    rangeEnd,
    selectedCity,
    selectedState,
    selectedCountry,
    selectedFormat,
    selectedCost,
  ]);

  // Group events by month for list view
  const groupedEvents = useMemo(() => {
    if (viewMode !== "list") return null;
    const groups = {};
    filteredEvents.forEach((event) => {
      const date = parseISODate(event.date || event.start_date);
      if (!date) return;
      const key = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    });
    return groups;
  }, [filteredEvents, viewMode]);

  return (
    <>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigate={handleNavigate}
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
            selectedCity={selectedCity}
            onCityChange={handleCityChange}
            selectedState={selectedState}
            onStateChange={handleStateChange}
            selectedCountry={selectedCountry}
            onCountryChange={handleCountryChange}
            selectedFormat={selectedFormat}
            onFormatChange={setSelectedFormat}
            selectedCost={selectedCost}
            onCostChange={setSelectedCost}
            cities={cities}
            states={states}
            countries={countries}
          />
          <main className="main" id="main-content">
            <div
              className="view-header"
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
                {filteredEvents && filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      viewMode="grid"
                      onSelectEvent={handleSelectEvent}
                    />
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
                {filteredEvents && filteredEvents.length > 0 ? (
                  Object.entries(groupedEvents).map(([month, monthEvents]) => (
                    <div key={month} className="events-list__month-group">
                      <h3 className="events-list__month-heading">{month}</h3>
                      <div className="events-list__month-rows">
                        {monthEvents.map((event) => (
                          <EventCard
                            key={event.id}
                            event={event}
                            viewMode="list"
                            onSelectEvent={handleSelectEvent}
                          />
                        ))}
                      </div>
                    </div>
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
            ) : (
              <EventMap
                events={filteredEvents}
                onSelectEvent={handleSelectEvent}
                theme={theme}
              />
            )}
          </main>
        </>
      ) : currentPage === "event-details" && selectedEvent ? (
        <EventDetails
          event={selectedEvent}
          onBack={() => handleNavigate("events")}
        />
      ) : currentPage === "about" ? (
        <AboutUs />
      ) : currentPage === "sponsors" ? (
        <Sponsors />
      ) : null}
      <Footer onNavigate={handleNavigate} />
      <BackToTop />
    </>
  );
}
