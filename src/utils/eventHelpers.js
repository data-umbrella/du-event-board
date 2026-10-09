export const getEventStatus = (startDateStr, endDateStr) => {
  if (!startDateStr) return "none";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const start = new Date(startDateStr + "T00:00:00");
  const targetStartDate = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );

  const effectiveEndStr = endDateStr || startDateStr;
  const end = new Date(effectiveEndStr + "T00:00:00");
  const targetEndDate = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
  );

  if (today > targetEndDate) return "ended";
  if (today >= targetStartDate && today <= targetEndDate) return "live";

  const diffTime = targetStartDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0 && diffDays <= 3) return "upcoming";

  return "none";
};
