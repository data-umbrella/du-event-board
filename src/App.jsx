
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

import { useState, useMemo, useEffect } from "react";
import Fuse from "fuse.js";

import Header from "./components/Header";
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


import EventBoard from "./pages/EventBoard";
import EventDetail from "./pages/EventDetail";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      typeof window.scrollTo === "function"
    ) {
      try {
        window.scrollTo({ top: 0 });
      } catch {}
    }
  }, [pathname]);

  return null;
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      if (
        typeof window !== "undefined" &&
        window.localStorage &&
        typeof window.localStorage.getItem === "function"
      ) {
        return window.localStorage.getItem("theme") || "dark";
      }
    } catch {}
    return "dark";
  });

  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }

    try {
      if (
        typeof window !== "undefined" &&
        window.localStorage &&
        typeof window.localStorage.setItem === "function"
      ) {
        window.localStorage.setItem("theme", theme);
      }
    } catch {}
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

  // Group events by month for list view
  const groupedEvents = useMemo(() => {
    if (viewMode !== "list") return null;
    const groups = {};
    filteredEvents.forEach((event) => {
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
  }, [filteredEvents, viewMode]);

  return (
    <BrowserRouter basename={import.meta.env.PROD ? "/du-event-board" : ""}>
      <ScrollToTop />

      <Header theme={theme} onToggleTheme={toggleTheme} />

      <Routes>
        <Route path="/" element={<EventBoard />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="*" element={<EventBoard />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}
