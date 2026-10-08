/**
 * Announces a message to assistive technology without showing it on screen.
 *
 * The board filters purely on the client side, so nothing tells a screen reader
 * user that the result set changed after they typed in the search box.
 */
export default function LiveRegion({
  message,
  politeness = "polite",
  className = "",
}) {
  return (
    <div
      className={`visually-hidden${className ? ` ${className}` : ""}`}
      role="status"
      aria-live={politeness}
      aria-atomic="true"
    >
      {message}
    </div>
  );
}
