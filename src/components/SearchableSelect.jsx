import { useState, useRef, useEffect } from "react";

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  id,
  clearable = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const wrapperRef = useRef(null);

  // Sync state if it changes from outside
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setInputValue(value || "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const filteredOptions =
    inputValue === value
      ? options
      : options.filter((opt) =>
          opt.toLowerCase().includes(inputValue.toLowerCase()),
        );

  return (
    <div className="searchable-select" ref={wrapperRef}>
      <div
        className="searchable-select__input-wrapper"
        style={{ position: "relative", width: "100%" }}
      >
        <input
          id={id}
          type="text"
          className={`search__select ${value && clearable ? "search__select--has-value" : ""}`}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onChange(inputValue);
              setIsOpen(false);
            }
          }}
          onClick={() => setIsOpen(true)}
          onFocus={(e) => e.target.select()}
          placeholder={placeholder}
          autoComplete="off"
        />
        {value && clearable && (
          <button
            type="button"
            className="searchable-select__clear-btn"
            onClick={(e) => {
              e.stopPropagation();
              setInputValue("");
              onChange("");
              setIsOpen(false);
            }}
            title="Clear selection"
          >
            ✕
          </button>
        )}
      </div>
      {isOpen && (
        <ul className="searchable-select__dropdown">
          {inputValue && clearable && (
            <li
              className="searchable-select__option searchable-select__option--clear"
              onClick={() => {
                setInputValue("");
                onChange("");
                setIsOpen(false);
              }}
            >
              Clear selection
            </li>
          )}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <li
                key={opt}
                className="searchable-select__option"
                onClick={() => {
                  setInputValue(opt);
                  onChange(opt);
                  setIsOpen(false);
                }}
              >
                {opt}
              </li>
            ))
          ) : (
            <li className="searchable-select__option searchable-select__option--empty">
              No matches found
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
