function renderOptions(options) {
  return options.map((option) => (
    <option key={option} value={option}>
      {option}
    </option>
  ));
}

export default function SearchBar({
  searchTerm,
  onSearchChange,
  selectedCountry,
  onCountryChange,
  selectedState,
  onStateChange,
  selectedRegion,
  onRegionChange,
  selectedCategory,
  onCategoryChange,
  selectedTag,
  onTagChange,
  selectedEventType,
  onEventTypeChange,
  selectedCost,
  onCostChange,
  dateFilterType,
  onDateFilterTypeChange,
  customDate,
  onCustomDateChange,
  rangeStart,
  onRangeStartChange,
  rangeEnd,
  onRangeEndChange,
  countries,
  states,
  regions,
  categories,
  hashtags,
  eventTypes,
  costs,
}) {
  // Show a quick visual guard when the user picks an inverted range.
  const isInvalidRange =
    dateFilterType === "customRange" &&
    rangeStart &&
    rangeEnd &&
    rangeStart > rangeEnd;

  return (
    <div className="search" id="search">
      <div className="search__container">
        <div className="search__row search__row--primary">
          <div className="search__input-wrapper">
            <span className="search__icon">🔍</span>
            <input
              id="search-input"
              type="text"
              className="search__input"
              placeholder="Search events, places, formats, or hashtags..."
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>

          <div className="search__select-wrapper">
            <select
              id="country-select"
              className="search__select"
              value={selectedCountry}
              onChange={(event) => onCountryChange(event.target.value)}
            >
              <option value="">All Countries</option>
              {renderOptions(countries)}
            </select>
          </div>

          <div className="search__select-wrapper">
            <select
              id="state-select"
              className="search__select"
              value={selectedState}
              onChange={(event) => onStateChange(event.target.value)}
            >
              <option value="">All States / Provinces</option>
              {renderOptions(states)}
            </select>
          </div>

          <div className="search__select-wrapper">
            <select
              id="region-select"
              className="search__select"
              value={selectedRegion}
              onChange={(event) => onRegionChange(event.target.value)}
            >
              <option value="">All Regions</option>
              {renderOptions(regions)}
            </select>
          </div>
        </div>

        <div className="search__row">
          <div className="search__select-wrapper">
            <select
              id="category-select"
              className="search__select"
              value={selectedCategory}
              onChange={(event) => onCategoryChange(event.target.value)}
            >
              <option value="">All Categories</option>
              {renderOptions(categories)}
            </select>
          </div>

          <div className="search__select-wrapper">
            <select
              id="hashtag-select"
              className="search__select"
              value={selectedTag}
              onChange={(event) => onTagChange(event.target.value)}
            >
              <option value="">All Hashtags</option>
              {hashtags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          </div>

          <div className="search__select-wrapper">
            <select
              id="event-type-select"
              className="search__select"
              value={selectedEventType}
              onChange={(event) => onEventTypeChange(event.target.value)}
            >
              <option value="">All Formats</option>
              {renderOptions(eventTypes)}
            </select>
          </div>

          <div className="search__select-wrapper">
            <select
              id="cost-select"
              className="search__select"
              value={selectedCost}
              onChange={(event) => onCostChange(event.target.value)}
            >
              <option value="">All Costs</option>
              {renderOptions(costs)}
            </select>
          </div>
        </div>

        <div className="search__row search__row--date">
          <div className="search__select-wrapper search__select-wrapper--date-type">
            <select
              id="date-filter-select"
              className="search__select"
              value={dateFilterType}
              onChange={(event) => onDateFilterTypeChange(event.target.value)}
              aria-label="Date filter"
            >
              <option value="all">All Dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
              <option value="customDate">Custom Date</option>
              <option value="customRange">Custom Range</option>
            </select>
          </div>

          {dateFilterType === "customDate" && (
            <div className="search__date-group">
              <input
                id="custom-date-input"
                type="date"
                className="search__date-input search__select"
                value={customDate}
                onChange={(event) => onCustomDateChange(event.target.value)}
                aria-label="Custom date"
              />
            </div>
          )}

          {dateFilterType !== "customDate" && (
            <div className="search__date-group">
              <input
                id="range-start-input"
                type={rangeStart ? "date" : "text"}
                placeholder="Start Date"
                onFocus={(event) => {
                  event.target.type = "date";
                }}
                onBlur={(event) => {
                  if (!event.target.value) event.target.type = "text";
                }}
                className={`search__date-input search__select ${
                  isInvalidRange ? "search__date-input--invalid" : ""
                }`}
                value={rangeStart}
                max={rangeEnd || undefined}
                onChange={(event) => {
                  if (dateFilterType !== "customRange") {
                    onDateFilterTypeChange("customRange");
                  }
                  onRangeStartChange(event.target.value);
                }}
                aria-label="Range start date"
              />
              <span className="search__date-separator">to</span>
              <input
                id="range-end-input"
                type={rangeEnd ? "date" : "text"}
                placeholder="End Date"
                onFocus={(event) => {
                  event.target.type = "date";
                }}
                onBlur={(event) => {
                  if (!event.target.value) event.target.type = "text";
                }}
                className={`search__date-input search__select ${
                  isInvalidRange ? "search__date-input--invalid" : ""
                }`}
                value={rangeEnd}
                min={rangeStart || undefined}
                onChange={(event) => {
                  if (dateFilterType !== "customRange") {
                    onDateFilterTypeChange("customRange");
                  }
                  onRangeEndChange(event.target.value);
                }}
                aria-label="Range end date"
              />
              {isInvalidRange && (
                <div className="search__error-message">
                  <span>Start date cannot be after end date</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
