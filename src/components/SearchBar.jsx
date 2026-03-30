export default function SearchBar({
  searchTerm,
  onSearchChange,
  selectedRegion,
  onRegionChange,
  selectedCategory,
  onCategoryChange,
  dateFilterType,
  onDateFilterTypeChange,
  customDate,
  onCustomDateChange,
  rangeStart,
  onRangeStartChange,
  rangeEnd,
  onRangeEndChange,
  regions,
  categories,
}) {
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
              placeholder="Search events by name, description, or tags..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div className="search__select-wrapper">
            <select
              id="region-select"
              className="search__select"
              value={selectedRegion}
              onChange={(e) => onRegionChange(e.target.value)}
            >
              <option value="">All Regions</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div className="search__select-wrapper">
            <select
              id="category-select"
              className="search__select"
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className="search__row search__row--date"
          style={{
            alignItems: "center",
            flexWrap: "wrap",
            display: "flex",
            gap: "0.75rem",
          }}
        >
          <div
            className={
              "search__select-wrapper search__select-wrapper--date-type"
            }
          >
            <select
              id="date-filter-select"
              className="search__select"
              value={dateFilterType}
              onChange={(e) => onDateFilterTypeChange(e.target.value)}
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
                onChange={(e) => onCustomDateChange(e.target.value)}
                aria-label="Custom date"
              />
            </div>
          )}

          {dateFilterType !== "customDate" && (
            <div
              className="search__date-group"
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <input
                id="range-start-input"
                type="date"
                placeholder="Start Date"
                className={`search__date-input search__select ${
                  isInvalidRange ? "search__date-input--invalid" : ""
                }`}
                value={rangeStart}
                max={rangeEnd || undefined}
                onChange={(e) => {
                  if (dateFilterType !== "customRange")
                    onDateFilterTypeChange("customRange");
                  onRangeStartChange(e.target.value);
                }}
                aria-label="Range start date"
                style={{ width: "160px" }}
              />
              <span
                className="search__date-separator"
                style={{ color: "var(--text-muted)" }}
              >
                —
              </span>
              <input
                id="range-end-input"
                type="date"
                placeholder="End Date"
                className={`search__date-input search__select ${
                  isInvalidRange ? "search__date-input--invalid" : ""
                }`}
                value={rangeEnd}
                min={rangeStart || undefined}
                onChange={(e) => {
                  if (dateFilterType !== "customRange")
                    onDateFilterTypeChange("customRange");
                  onRangeEndChange(e.target.value);
                }}
                aria-label="Range end date"
                style={{ width: "160px" }}
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
