export default function Header({ theme, onToggleTheme }) {
  return (
    <header className="header" id="header">
      {/* Theme toggle button  */}
      <button
        className="theme-toggle"
        onClick={onToggleTheme}
        aria-label="Toggle Theme"
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

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
