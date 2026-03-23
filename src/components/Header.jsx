import { useBookmarks } from "../hooks/useBookmarks";
export default function Header({
  theme,
  onToggleTheme,
  onToggleSaved,
  isShowingSaved,
}) {
  const { bookmarks } = useBookmarks();
  const count = bookmarks.length;
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

      {/* --- NEW: Saved Events Toggle Button --- */}
      <button
        className={`header__saved-btn ${isShowingSaved ? "is-active" : ""}`}
        onClick={onToggleSaved}
      >
        <span className="header__saved-icon">
          {isShowingSaved ? "🏠" : "❤️"}
        </span>
        <span className="header__saved-text">
          {isShowingSaved ? " Go back to Home" : ` Saved Events(${count})`}
        </span>
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
