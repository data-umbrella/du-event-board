export const getEventStatus = (eventDate) => {
  if (!eventDate) return "none";

  const now = new Date();
  const event = new Date(eventDate + "T00:00:00");

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(
    event.getFullYear(),
    event.getMonth(),
    event.getDate(),
  );

  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "ended";
  if (diffDays === 0) return "live";
  if (diffDays > 0 && diffDays <= 3) return "upcoming";

  return "none";
};
