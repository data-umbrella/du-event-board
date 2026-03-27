export function getEventStatus(dateString) {
  if (!dateString) return "none";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventDate = new Date(dateString + "T00:00:00");
  if (isNaN(eventDate)) return "none";

  if (eventDate.getTime() === today.getTime()) {
    return "live";
  }

  if (eventDate > today) {
    return "upcoming";
  }

  if (eventDate < today) {
    return "ended";
  }

  return "none";
}