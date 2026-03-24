import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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

export default function EventMap({
  events,
  theme = "dark",
  onNearMe,
  searchRadius = 50,
  onRadiusChange,
  notification,
}) {
  // Find center based on first geocoded event or fallback
  const mapCenter = events.find((e) => e.lat && e.lng)
    ? [
        events.find((e) => e.lat && e.lng).lat,
        events.find((e) => e.lat && e.lng).lng,
      ]
    : [-14.235, -51.925]; // Center of Brazil as fallback

  // Filter events with valid coords
  const mapEvents = events.filter((e) => e.lat && e.lng);

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
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -20, x: "-50%" }}
              style={{
                position: "absolute",
                top: "20px",
                left: "50%",
                zIndex: 1001,
                background: "rgba(220, 38, 38, 0.9)",
                color: "white",
                padding: "12px 24px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "600",
                boxShadow: "0 8px 32px rgba(220, 38, 38, 0.3)",
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
                <span>⚠️</span> {notification}
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
            onClick={onNearMe}
            className="map-near-me-btn-primary"
            style={{
              width: "100%",
              marginBottom: "20px",
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
              marginBottom: "10px",
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
          <input
            type="range"
            min="5"
            max="200"
            step="5"
            value={searchRadius}
            onChange={(e) => onRadiusChange(parseInt(e.target.value, 10))}
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
