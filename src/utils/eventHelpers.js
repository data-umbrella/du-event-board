/**
 * Determines the status of an event based on its date relative to today.
 * Handles normalization to ensure time-of-day doesn't interfere with the check.
 * * @param {string} dateString - ISO date string (YYYY-MM-DD)
 * @returns {"live" | "upcoming" | "ended" | "none"}
 */
export const getEventStatus = (dateString) => {
  if (!dateString) return "none";

  // 1. Get "Today" at exactly 00:00:00
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 2. Parse the Event Date (forced to local midnight)
  const eventDate = new Date(dateString + "T00:00:00");

  // Safety check for invalid date strings
  if (isNaN(eventDate)) return "none";

  // 3. Calculate the difference in full days
  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // 4. Return the status based on the day difference
  if (diffDays < 0) {
    return "ended";
  }

  if (diffDays === 0) {
    return "live";
  }

  if (diffDays > 0 && diffDays <= 3) {
    return "upcoming";
  }

  return "none";
};
