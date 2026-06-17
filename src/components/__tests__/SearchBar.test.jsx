import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SearchBar from "../SearchBar";

describe("SearchBar Component", () => {
  it("renders search input and calls onSearchChange", () => {
    const handleSearchChange = vi.fn();
    render(
      <SearchBar
        searchTerm=""
        onSearchChange={handleSearchChange}
        dateFilterType="all"
      />,
    );

    const input = screen.getByPlaceholderText(/Search events/i);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "Python" } });
    expect(handleSearchChange).toHaveBeenCalledWith("Python");
  });

  it("enables the Clear Filters button when there are active filters", () => {
    const handleClear = vi.fn();
    // Pass a non-empty search term to make filters active
    render(
      <SearchBar
        searchTerm="React"
        onSearchChange={handleClear}
        dateFilterType="all"
        onDateFilterTypeChange={() => {}}
        onRegionChange={() => {}}
        onCategoryChange={() => {}}
        onCustomDateChange={() => {}}
        onRangeStartChange={() => {}}
        onRangeEndChange={() => {}}
      />,
    );

    const clearBtn = screen.getByTitle("Clear all filters");
    expect(clearBtn).not.toBeDisabled();

    fireEvent.click(clearBtn);
    expect(handleClear).toHaveBeenCalledWith("");
  });
});
