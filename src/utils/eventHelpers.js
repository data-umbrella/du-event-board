export const getEventStatus = (dateString) => {
  if (!dateString) {
    return { label: "TBD" };
  }

  // Safe parsing (no timezone bugs)
  const [year, month, day] = dateString.split("-").map(Number);
  const eventDate = new Date(year, month - 1, day);

  const now = new Date();

  // Normalize both dates
  eventDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  if (isNaN(eventDate.getTime())) {
    return { label: "Invalid" };
  }

  if (eventDate.getTime() === now.getTime()) {
    return { label: "Today" };
  }

  if (eventDate > now) {
    return { label: "Upcoming" };
  }

  return { label: "Past" };
};
