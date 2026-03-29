export default function Header({ theme, onToggleTheme, onNavigate }) {
  return (
    <header className="header" id="header">
      <div className="header__controls">
        <button
          type="button"
          onClick={() =>
            onNavigate ? onNavigate("events") : (window.location.href = "/")
          }
          className="header__nav-btn"
        >
          Events
        </button>

        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>

      <div className="header__content">
        <div className="header__brand">
          <img
            src="/du-event-board/DU_logo.png"
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
