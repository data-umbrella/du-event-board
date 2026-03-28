import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ExternalLink, MapPin } from "lucide-react";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// MarkerCluster styles
import "react-leaflet-cluster/lib/assets/MarkerCluster.css";
import "react-leaflet-cluster/lib/assets/MarkerCluster.Default.css";

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const RADIUS_PRESETS = [50, 100, 200];

// Internal component to handle map view changes reactively.
// Only zooms when userCoords changes (i.e. "Find Near Me" is clicked),
// NOT when the slider/presets change — so the user can freely adjust
// the radius without the map jumping.
function MapController({ userCoords, searchRadius }) {
  const map = useMap();

  useEffect(() => {
    if (!userCoords) return;
    // Manually compute bounding box from the radius at the moment of location acquisition.
    // 1 degree latitude ≈ 111 km; longitude degrees shrink by cos(lat).
    const latOffset = searchRadius / 111;
    const lngOffset =
      searchRadius / (111 * Math.cos((userCoords.lat * Math.PI) / 180));
    const bounds = L.latLngBounds(
      [userCoords.lat - latOffset, userCoords.lng - lngOffset],
      [userCoords.lat + latOffset, userCoords.lng + lngOffset],
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCoords]); // intentionally omit searchRadius — zoom only on new location

  return null;
}

export default function EventMap({
  events,
  theme = "dark",
  onNearMe,
  searchRadius = 50,
  onRadiusChange,
  notification,
  userCoords,
  proximityActive,
}) {
  const [localRadius, setLocalRadius] = React.useState(searchRadius);

  // Sync localRadius if searchRadius prop changes from outside (e.g. URL update or handleNearMe completion)
  React.useEffect(() => {
    setLocalRadius(searchRadius);
  }, [searchRadius]);

  // Find center based on first geocoded event or fallback
  const mapCenter = events.find((e) => e.lat && e.lng)
    ? [
        events.find((e) => e.lat && e.lng).lat,
        events.find((e) => e.lat && e.lng).lng,
      ]
    : [-14.235, -51.925]; // Center of Brazil as fallback

  // Filter events with valid coords
  const mapEvents = events.filter((e) => e.lat && e.lng);

  // Calculate events within radius for live display
  const eventsInRadius = React.useMemo(() => {
    if (!userCoords) return 0;
    const radiusDeg = searchRadius / 111;
    const maxDistSq = radiusDeg * radiusDeg;
    return events.filter((e) => {
      if (!e.lat || !e.lng) return false;
      const d2 =
        Math.pow(e.lat - userCoords.lat, 2) +
        Math.pow(e.lng - userCoords.lng, 2);
      return d2 <= maxDistSq;
    }).length;
  }, [events, userCoords, searchRadius]);

  // Choose tile layer based on theme
  const tileUrl =
    theme === "light"
      ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  if (mapEvents.length === 0) {
    return (
      <div className="empty-state" id="empty-state">
        <div className="empty-state__icon">🗺️</div>
        <h2 className="empty-state__title">No locations found</h2>
        <p className="empty-state__description">
          None of the filtered events have map coordinates available.
        </p>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="map-container"
        style={{
          height: "650px",
          width: "100%",
          borderRadius: "24px",
          overflow: "hidden",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-lg), var(--shadow-glow)",
          marginBottom: "2rem",
          position: "relative",
        }}
      >
        {/* Notification Toast */}
        <AnimatePresence>
          {notification && notification.message && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -20, x: "-50%" }}
              style={{
                position: "absolute",
                top: "20px",
                left: "50%",
                zIndex: 1001,
                background:
                  notification.type === "success"
                    ? "rgba(16, 185, 129, 0.9)"
                    : "rgba(220, 38, 38, 0.9)",
                color: "white",
                padding: "12px 24px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "600",
                boxShadow:
                  notification.type === "success"
                    ? "0 8px 32px rgba(16, 185, 129, 0.3)"
                    : "0 8px 32px rgba(220, 38, 38, 0.3)",
                backdropFilter: "blur(8px)",
                pointerEvents: "none",
                textAlign: "center",
                minWidth: "280px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <span>{notification.type === "success" ? "✅" : "⚠️"}</span>{" "}
                {notification.message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Combined Geolocation Control Panel */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            zIndex: 1000,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-accent)",
            borderRadius: "20px",
            padding: "20px",
            width: "280px",
            boxShadow: "var(--shadow-lg), 0 0 30px rgba(124, 92, 252, 0.15)",
            backdropFilter: "blur(12px)",
          }}
          className="map-control-panel"
        >
          <button
            onClick={() => onNearMe(localRadius)}
            className="map-near-me-btn-primary"
            style={{
              width: "100%",
              marginBottom: "16px",
              padding: "12px",
              borderRadius: "12px",
              background: "var(--accent-primary)",
              color: "white",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 4px 15px rgba(124, 92, 252, 0.4)",
            }}
          >
            <MapPin size={20} />
            Find Events Near Me
          </button>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Search Radius
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              {proximityActive && userCoords && (
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "var(--accent-primary)",
                    background: "var(--accent-glow)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {eventsInRadius} found
                </span>
              )}
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "var(--accent-primary)",
                  background: "var(--accent-glow)",
                  padding: "2px 8px",
                  borderRadius: "6px",
                }}
              >
                {searchRadius}km
              </span>
            </div>
          </div>

          {/* Preset buttons */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              marginBottom: "10px",
            }}
          >
            {RADIUS_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => setLocalRadius(preset)}
                style={{
                  flex: 1,
                  padding: "5px 0",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  border:
                    localRadius === preset
                      ? "1px solid var(--accent-primary)"
                      : "1px solid var(--border-subtle)",
                  background:
                    localRadius === preset
                      ? "var(--accent-primary)"
                      : "var(--bg-input)",
                  color:
                    localRadius === preset ? "#fff" : "var(--text-secondary)",
                  boxShadow:
                    localRadius === preset
                      ? "0 0 10px rgba(124, 92, 252, 0.35)"
                      : "none",
                }}
              >
                {preset}km
              </button>
            ))}
          </div>

          <input
            type="range"
            min="5"
            max="200"
            step="5"
            value={localRadius}
            onChange={(e) => setLocalRadius(parseInt(e.target.value, 10))}
            style={{
              width: "100%",
              cursor: "pointer",
            }}
            className="radius-slider"
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "4px",
              fontSize: "10px",
              color: "var(--text-muted)",
            }}
          >
            <span>5km</span>
            <span>200km</span>
          </div>
        </div>

        <MapContainer
          center={mapCenter}
          zoom={4}
          style={{
            height: "100%",
            width: "100%",
            background: theme === "light" ? "#f8f9fa" : "#111",
          }}
        >
          <TileLayer
            url={tileUrl}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {/* Auto-pan/zoom controller */}
          <MapController userCoords={userCoords} searchRadius={searchRadius} />

          {/* Visual radius circle when proximity search is active */}
          {proximityActive && userCoords && (
            <Circle
              center={[userCoords.lat, userCoords.lng]}
              radius={searchRadius * 1000}
              pathOptions={{
                color: "#7c5cfc",
                fillColor: "#7c5cfc",
                fillOpacity: 0.08,
                weight: 2,
                dashArray: "6 4",
                opacity: 0.7,
              }}
            />
          )}

          <MarkerClusterGroup chunkedLoading>
            {mapEvents.map((event) => (
              <Marker key={event.id} position={[event.lat, event.lng]}>
                <Popup className="premium-popup">
                  <div className="popup-content">
                    <span className="event-card__category popup-category">
                      {event.category}
                    </span>
                    <h3 className="popup-title">{event.title}</h3>

                    <div className="popup-meta">
                      <Calendar size={14} />
                      {event.date} • {event.time}
                    </div>

                    <p className="popup-description">{event.description}</p>

                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="popup-link"
                    >
                      View Details <ExternalLink size={14} />
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </motion.div>
    </AnimatePresence>
  );
}
