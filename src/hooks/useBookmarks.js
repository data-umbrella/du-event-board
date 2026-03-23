import { useState, useEffect } from "react";

export function useBookmarks() {
  // 1. Use a function inside useState to initialize the state only once
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem("event_bookmarks");
      // Check if it exists and isn't the string "undefined"
      if (saved && saved !== "undefined") {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Could not parse bookmarks from localStorage", error);
    }
    return []; // Fallback to empty array
  });

  // 2. Use an effect to sync localStorage whenever the 'bookmarks' state changes
  useEffect(() => {
    localStorage.setItem("event_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  const toggleBookmark = (eventId) => {
    setBookmarks((prev) => {
      const isAlreadyBookmarked = prev.includes(eventId);
      if (isAlreadyBookmarked) {
        return prev.filter((id) => id !== eventId);
      } else {
        return [...prev, eventId];
      }
    });
  };

  const isBookmarked = (eventId) => bookmarks.includes(eventId);

  return { bookmarks, toggleBookmark, isBookmarked };
}
