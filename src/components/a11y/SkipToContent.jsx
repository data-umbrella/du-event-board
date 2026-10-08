/**
 * Keyboard-only escape hatch from the header to the page body.
 *
 * Without this, a keyboard user has to tab through every control in the header
 * on every page load before reaching the event list.
 */
export default function SkipToContent({
  targetId = "main-content",
  label = "Skip to main content",
}) {
  return (
    <a className="skip-link" href={`#${targetId}`}>
      {label}
    </a>
  );
}
