import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ExternalLink } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

export default function EventMap({ events, theme }) {
  const firstGeocodedEvent = events.find((e) => e.lat && e.lng);
  const mapCenter = firstGeocodedEvent
    ? [firstGeocodedEvent.lat, firstGeocodedEvent.lng]
    : [-14.235, -51.925];

  const mapEvents = events.filter((e) => e.lat && e.lng);

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
        }}
      >
        <MapContainer
          center={mapCenter}
          zoom={4}
          style={{
            height: "100%",
            width: "100%",
            background: "var(--bg-primary)",
          }}
        >
          <TileLayer
            url={
              theme === "light"
                ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            }
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {mapEvents.map((event) => (
            <Marker key={event.id} position={[event.lat, event.lng]}>
              <Popup className="premium-popup">
                <div style={{ minWidth: "220px" }}>
                  <span
                    className="event-card__category"
                    style={{ marginBottom: "10px", display: "inline-block" }}
                  >
                    {event.category}
                  </span>
                  <h3
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      color: "var(--text-primary)",
                    }}
                  >
                    {event.title}
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      marginBottom: "12px",
                    }}
                  >
                    <Calendar size={14} />
                    {event.date} • {event.time}
                  </div>

                  <p
                    style={{
                      fontSize: "14px",
                      margin: "0 0 16px 0",
                      color: "var(--text-secondary)",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      lineHeight: "1.5",
                    }}
                  >
                    {event.description}
                  </p>

                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      textDecoration: "none",
                      backgroundColor: "var(--accent-primary)",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "600",
                      transition: "all 0.2s",
                      width: "100%",
                      justifyContent: "center",
                    }}
                  >
                    View Details <ExternalLink size={14} />
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </motion.div>
    </AnimatePresence>
  );
}
