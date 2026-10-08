export default function Header({
  theme,
  onToggleTheme,
  onNavigate,
  currentPage = "events",
}) {
  return (
    <header className="header" id="header">
      <div className="header__controls">
        <nav aria-label="Primary">
          <button
            type="button"
            onClick={() =>
              onNavigate ? onNavigate("events") : (window.location.href = "/")
            }
            className="header__nav-btn"
            aria-current={currentPage === "events" ? "page" : undefined}
          >
            Events
          </button>
        </nav>

        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label="Toggle Theme"
          aria-pressed={theme === "light"}
        >
          <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
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
