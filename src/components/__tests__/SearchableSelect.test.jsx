import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SearchableSelect from "../SearchableSelect";

describe("SearchableSelect Component", () => {
  const options = ["React", "Python", "Vue"];

  it("renders input with placeholder", () => {
    render(
      <SearchableSelect
        options={options}
        value=""
        onChange={() => {}}
        placeholder="Select tech"
        id="tech-select"
      />,
    );
    expect(screen.getByPlaceholderText("Select tech")).toBeInTheDocument();
  });

  it("opens dropdown and filters options when typing", () => {
    render(
      <SearchableSelect
        options={options}
        value=""
        onChange={() => {}}
        placeholder="Select tech"
        id="tech-select"
      />,
    );

    const input = screen.getByPlaceholderText("Select tech");
    fireEvent.change(input, { target: { value: "re" } }); // Should match 'React'

    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.queryByText("Python")).not.toBeInTheDocument();
  });

  it("calls onChange when an option is clicked", () => {
    const handleChange = vi.fn();
    render(
      <SearchableSelect
        options={options}
        value=""
        onChange={handleChange}
        placeholder="Select tech"
        id="tech-select"
      />,
    );

    const input = screen.getByPlaceholderText("Select tech");
    fireEvent.click(input); // Open dropdown

    const option = screen.getByText("Python");
    fireEvent.click(option);

    expect(handleChange).toHaveBeenCalledWith("Python");
  });

  it("clears selection when clear button is clicked", () => {
    const handleChange = vi.fn();
    render(
      <SearchableSelect
        options={options}
        value="Python"
        onChange={handleChange}
        placeholder="Select tech"
        id="tech-select"
        clearable={true}
      />,
    );

    const clearBtn = screen.getByTitle("Clear selection");
    fireEvent.click(clearBtn);

    expect(handleChange).toHaveBeenCalledWith("");
  });
});
