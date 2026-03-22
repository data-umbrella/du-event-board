import { useState } from "react";

function toYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function CalendarView({ events, onDateSelect, selectedDate }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const eventDates = new Set(events.map((e) => e.date).filter(Boolean));

  const firstDay = new Date(viewYear, viewMonth, 1);
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleDayClick(day) {
    const ymd = toYMD(new Date(viewYear, viewMonth, day));
    onDateSelect(selectedDate === ymd ? "" : ymd);
  }

  const todayYMD = toYMD(today);
  const cells = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  return (
    <div className="calendar">
      <div className="calendar__header">
        <button
          className="calendar__nav-btn"
          onClick={prevMonth}
          aria-label="Previous month"
        >
          &#8249;
        </button>
        <span className="calendar__title">
          {monthNames[viewMonth]} {viewYear}
        </span>
        <button
          className="calendar__nav-btn"
          onClick={nextMonth}
          aria-label="Next month"
        >
          &#8250;
        </button>
      </div>

      <div className="calendar__grid">
        {dayNames.map((name) => (
          <div key={name} className="calendar__day-name">
            {name}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) {
            return (
              <div
                key={`empty-${i}`}
                className="calendar__cell calendar__cell--empty"
              />
            );
          }
          const ymd = toYMD(new Date(viewYear, viewMonth, day));
          const hasEvent = eventDates.has(ymd);
          const isToday = ymd === todayYMD;
          const isSelected = ymd === selectedDate;

          let cls = "calendar__cell";
          if (isToday) cls += " calendar__cell--today";
          if (isSelected) cls += " calendar__cell--selected";
          if (hasEvent) cls += " calendar__cell--has-event";

          return (
            <button
              key={ymd}
              className={cls}
              onClick={() => handleDayClick(day)}
              aria-label={`${ymd}${hasEvent ? " - has events" : ""}`}
              aria-pressed={isSelected}
            >
              {day}
              {hasEvent && <span className="calendar__dot" />}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <button className="calendar__clear" onClick={() => onDateSelect("")}>
          Clear date filter
        </button>
      )}
    </div>
  );
}
