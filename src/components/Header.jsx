import { MoonIcon, SunIcon } from "lucide-react";

export default function Header({ theme, onToggleTheme, onNavigate }) {
  return (
    <header className="header" id="header">
      <div className="header__controls">
        <button
          onClick={() =>
            onNavigate ? onNavigate("events") : (window.location.href = "/")
          }
          className="header__nav-btn"
        >
          Events
        </button>

        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <SunIcon size={16} color="#f2e674" />
          ) : (
            <MoonIcon size={16} color="#4a5568" />
          )}
        </button>
      </div>

      <div className="header__content">
        <div className="header__brand">
          <img
            src="https://github.com/data-umbrella.png"
            alt="Data Umbrella Logo"
            className="header__logo-img"
          />
          <h1 className="header__logo">DU Event Board</h1>
        </div>
        <p className="header__tagline">
          Discover tech events, meetups, and workshops near your region
        </p>
      </div>
    </header>
  );
}
