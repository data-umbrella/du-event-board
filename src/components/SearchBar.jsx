import React from "react";
import SearchableSelect from "./SearchableSelect";

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
  selectedCity,
  onCityChange,
  selectedState,
  onStateChange,
  selectedCountry,
  onCountryChange,
  selectedFormat,
  onFormatChange,
  selectedCost,
  onCostChange,
  cities,
  states,
  countries,
}) {
  const formatOptions = ["In-Person", "Online", "Hybrid"];
  const formatLabelToValue = {
    "In-Person": "in-person",
    Online: "online",
    Hybrid: "hybrid",
  };
  const formatValueToLabel = {
    "in-person": "In-Person",
    online: "Online",
    hybrid: "Hybrid",
  };

  const costOptions = ["Free", "Paid"];
  const costLabelToValue = { Free: "free", Paid: "paid" };
  const costValueToLabel = { free: "Free", paid: "Paid" };

  const dateTypeOptions = [
    "All Dates",
    "Upcoming",
    "This Week",
    "This Month",
    "Custom Date",
    "Custom Range",
  ];
  const dateTypeLabelToValue = {
    "All Dates": "all",
    Upcoming: "upcoming",
    "This Week": "thisWeek",
    "This Month": "thisMonth",
    "Custom Date": "customDate",
    "Custom Range": "customRange",
  };
  const dateTypeValueToLabel = {
    all: "All Dates",
    upcoming: "Upcoming",
    thisWeek: "This Week",
    thisMonth: "This Month",
    customDate: "Custom Date",
    customRange: "Custom Range",
  };

  const isInvalidRange =
    dateFilterType === "customRange" &&
    rangeStart &&
    rangeEnd &&
    new Date(rangeStart) > new Date(rangeEnd);

  // Reset logic for all fields
  const handleClearFilters = () => {
    onSearchChange("");
    onRegionChange("");
    onCategoryChange("");
    onDateFilterTypeChange("all");
    onCustomDateChange("");
    onRangeStartChange("");
    onRangeEndChange("");
    if (onCityChange) onCityChange("");
    if (onStateChange) onStateChange("");
    if (onCountryChange) onCountryChange("");
    if (onFormatChange) onFormatChange("");
    if (onCostChange) onCostChange("");
  };

  // Show button only if any filter is active
  const hasActiveFilters =
    searchTerm !== "" ||
    selectedRegion !== "" ||
    selectedCategory !== "" ||
    dateFilterType !== "all" ||
    customDate !== "" ||
    rangeStart !== "" ||
    rangeEnd !== "" ||
    selectedCity !== "" ||
    selectedState !== "" ||
    selectedCountry !== "" ||
    selectedFormat !== "" ||
    selectedCost !== "";

  return (
    <div
      className="search"
      id="search"
      role="search"
      aria-label="Filter events"
    >
      <div className="search__container">
        {/* ROW 1: Search, Categories, Format, Cost */}
        <div
          className="search__row search__row--primary"
          style={{
            flexWrap: "wrap",
            display: "flex",
            gap: "0.75rem",
            width: "100%",
            alignItems: "center",
          }}
        >
          <div className="search__input-wrapper" style={{ flex: "2 1 250px" }}>
            <span className="search__icon" aria-hidden="true">
              🔍
            </span>
            <label className="visually-hidden" htmlFor="search-input">
              Search events
            </label>
            <input
              id="search-input"
              type="text"
              className="search__input"
              placeholder="Search events by name, description, or tags..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div
            className="search__select-wrapper"
            style={{ flex: "1 1 130px", minWidth: "120px" }}
          >
            <SearchableSelect
              id="category-select"
              label="Category"
              options={categories || []}
              value={selectedCategory}
              onChange={onCategoryChange}
              placeholder="All Categories"
            />
          </div>

          <div
            className="search__select-wrapper"
            style={{ flex: "1 1 130px", minWidth: "120px" }}
          >
            <SearchableSelect
              id="format-select"
              label="Format"
              options={formatOptions}
              value={formatValueToLabel[selectedFormat] || ""}
              onChange={(label) =>
                onFormatChange(formatLabelToValue[label] || "")
              }
              placeholder="Format"
            />
          </div>

          <div
            className="search__select-wrapper"
            style={{ flex: "1 1 130px", minWidth: "120px" }}
          >
            <SearchableSelect
              id="cost-select"
              label="Event Cost"
              options={costOptions}
              value={costValueToLabel[selectedCost] || ""}
              onChange={(label) => onCostChange(costLabelToValue[label] || "")}
              placeholder="Event Cost"
            />
          </div>

          <button
            type="button"
            onClick={handleClearFilters}
            className="search__clear-btn"
            title="Clear all filters"
            style={{ flex: "0 0 auto", whiteSpace: "nowrap" }}
            disabled={!hasActiveFilters}
          >
            <span className="search__clear-icon">✕</span>
            Clear Filters
          </button>
        </div>

        {/* ROW 2: Locations, Dates */}
        <div
          className="search__row search__row--secondary"
          style={{
            flexWrap: "wrap",
            display: "flex",
            gap: "0.75rem",
            width: "100%",
            alignItems: "center",
          }}
        >
          <div
            className="search__select-wrapper"
            style={{ flex: "1 1 130px", minWidth: "120px" }}
          >
            <SearchableSelect
              id="city-input"
              label="City"
              options={cities || []}
              value={selectedCity}
              onChange={onCityChange}
              placeholder="City"
            />
          </div>

          <div
            className="search__select-wrapper"
            style={{ flex: "1 1 130px", minWidth: "120px" }}
          >
            <SearchableSelect
              id="state-input"
              label="State or Province"
              options={states || []}
              value={selectedState}
              onChange={onStateChange}
              placeholder="State/Province"
            />
          </div>

          <div
            className="search__select-wrapper"
            style={{ flex: "1 1 130px", minWidth: "120px" }}
          >
            <SearchableSelect
              id="country-input"
              label="Country"
              options={countries || []}
              value={selectedCountry}
              onChange={onCountryChange}
              placeholder="Country"
            />
          </div>

          <div
            className="search__select-wrapper"
            style={{ flex: "1 1 130px", minWidth: "120px" }}
          >
            <SearchableSelect
              id="region-input"
              label="Region"
              options={regions || []}
              value={selectedRegion}
              onChange={onRegionChange}
              placeholder="Region"
            />
          </div>

          <div
            className="search__select-wrapper search__select-wrapper--date-type"
            style={{ flex: "1 1 130px", minWidth: "120px" }}
          >
            <SearchableSelect
              id="date-filter-select"
              label="Date"
              options={dateTypeOptions}
              value={dateTypeValueToLabel[dateFilterType] || ""}
              onChange={(label) =>
                onDateFilterTypeChange(dateTypeLabelToValue[label] || "all")
              }
              placeholder="All Dates"
              clearable={false}
            />
          </div>

          {dateFilterType === "customDate" && (
            <div className="search__date-group" style={{ flex: "1 1 160px" }}>
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
                gap: "0.5rem",
                alignItems: "center",
                flexWrap: "nowrap",
                flex: "2 1 240px",
              }}
            >
              <input
                id="range-start-input"
                type={rangeStart ? "date" : "text"}
                placeholder="Start Date"
                onFocus={(e) => {
                  e.target.type = "date";
                }}
                onBlur={(e) => {
                  if (!e.target.value) e.target.type = "text";
                }}
                className={`search__date-input search__select ${isInvalidRange ? "search__date-input--invalid" : ""}`}
                value={rangeStart}
                max={rangeEnd || undefined}
                onChange={(e) => {
                  if (dateFilterType !== "customRange")
                    onDateFilterTypeChange("customRange");
                  onRangeStartChange(e.target.value);
                }}
                aria-label="Range start date"
                aria-invalid={isInvalidRange}
                style={{ width: "100%", minWidth: "110px" }}
              />
              <span
                className="search__date-separator"
                style={{ color: "var(--text-muted)" }}
                aria-hidden="true"
              >
                —
              </span>
              <input
                id="range-end-input"
                type={rangeEnd ? "date" : "text"}
                placeholder="End Date"
                onFocus={(e) => {
                  e.target.type = "date";
                }}
                onBlur={(e) => {
                  if (!e.target.value) e.target.type = "text";
                }}
                className={`search__date-input search__select ${isInvalidRange ? "search__date-input--invalid" : ""}`}
                value={rangeEnd}
                min={rangeStart || undefined}
                onChange={(e) => {
                  if (dateFilterType !== "customRange")
                    onDateFilterTypeChange("customRange");
                  onRangeEndChange(e.target.value);
                }}
                aria-label="Range end date"
                aria-invalid={isInvalidRange}
                style={{ width: "100%", minWidth: "110px" }}
              />
              {isInvalidRange && (
                <div className="search__error-message" role="alert">
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
