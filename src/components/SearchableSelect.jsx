import { useState, useRef, useEffect, useId } from "react";

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  id,
  label,
  clearable = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const wrapperRef = useRef(null);
  const listboxId = useId();
  const clearLabel = `Clear ${label || placeholder || "selection"}`;

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
        {label && (
          <label className="visually-hidden" htmlFor={id}>
            {label}
          </label>
        )}
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
              e.preventDefault();
              onChange(inputValue);
              setIsOpen(false);
            } else if (e.key === "Escape") {
              setIsOpen(false);
              setInputValue(value || "");
            }
          }}
          onClick={() => setIsOpen(true)}
          onFocus={(e) => e.target.select()}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
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
            aria-label={clearLabel}
          >
            <span aria-hidden="true">✕</span>
          </button>
        )}
      </div>
      {isOpen && (
        <ul
          className="searchable-select__dropdown"
          role="listbox"
          id={listboxId}
          aria-label={label || placeholder}
        >
          {inputValue && clearable && (
            <li
              className="searchable-select__option searchable-select__option--clear"
              onClick={() => {
                setInputValue("");
                onChange("");
                setIsOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setInputValue("");
                  onChange("");
                  setIsOpen(false);
                }
              }}
              role="option"
              aria-selected="false"
              tabIndex={0}
            >
              Clear selection
            </li>
          )}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <li
                key={opt}
                className={`searchable-select__option ${opt === value ? "selected" : ""}`}
                onClick={() => {
                  setInputValue(opt);
                  onChange(opt);
                  setIsOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setInputValue(opt);
                    onChange(opt);
                    setIsOpen(false);
                  }
                }}
                role="option"
                aria-selected={opt === value}
                tabIndex={0}
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
