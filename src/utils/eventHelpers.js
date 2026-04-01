const parseDate = (value) => {
  if (!value) return null;
  const dateString = String(value);
  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getEventStatus = (eventOrDate) => {
  if (!eventOrDate) return "none";

  let startDate = null;
  let endDate = null;

  if (typeof eventOrDate === "string") {
    startDate = parseDate(eventOrDate);
    endDate = startDate;
  } else if (typeof eventOrDate === "object") {
    startDate = parseDate(eventOrDate.startDate || eventOrDate.date);
    endDate = parseDate(eventOrDate.endDate || eventOrDate.date);
  }

  if (!startDate || !endDate) return "none";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (today > endDate) return "ended";

  if (today >= startDate && today <= endDate) return "live";

  const diffTime = startDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0 && diffDays <= 3) return "upcoming";
  return "none";
}
