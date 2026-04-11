import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  ZoomControl,
} from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ExternalLink, Locate } from "lucide-react";
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

// Component to handle map bounds and automatic geolocation
function MapController({ events }) {
  const map = useMap();
  const locationCircleRef = React.useRef(null);
  const [hasLocated, setHasLocated] = useState(false);

  useEffect(() => {
    // 1. Initial fit bounds to cover all events (if any)
    // Using zoom 7 for a better "regional/city" context while still broad
    if (events.length > 0 && !hasLocated) {
      const bounds = L.latLngBounds(events.map((e) => [e.lat, e.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 7 });
    }

    // 2. Automatically trigger geolocation on mount
    if (!hasLocated) {
      map.locate({ setView: true, maxZoom: 8 });
    }

    const onLocationFound = (e) => {
      setHasLocated(true);
      if (locationCircleRef.current) {
        map.removeLayer(locationCircleRef.current);
      }
      locationCircleRef.current = L.circle(e.latlng, {
        radius: e.accuracy,
        color: "var(--accent-primary)",
        fillColor: "var(--accent-primary)",
        fillOpacity: 0.1,
        weight: 1,
      }).addTo(map);
    };

    const onLocationError = (e) => {
      // If location fails/denied, explicitly show ALL events
      console.warn("Geolocation fallback: showing entire map view.");
      setHasLocated(true);
      if (events.length > 0) {
        const bounds = L.latLngBounds(events.map((e) => [e.lat, e.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 7 });
      }
    };

    map.on("locationfound", onLocationFound);
    map.on("locationerror", onLocationError);

    return () => {
      map.off("locationfound", onLocationFound);
      map.off("locationerror", onLocationError);
    };
  }, [events, map, hasLocated]);

  return null;
}

export default function EventMap({ events }) {
  // Filter events with valid coords
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

  // Initial center: World view
  const initialCenter = [20, 0];
  const initialZoom = 2;

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
        <MapContainer
          center={initialCenter}
          zoom={initialZoom}
          zoomControl={false}
          style={{
            height: "100%",
            width: "100%",
            background: "var(--bg-primary)",
          }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          <ZoomControl position="topright" />
          <MapController events={mapEvents} />

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
                      color: "#111",
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
                      color: "#555",
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
                      color: "#333",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      lineHeight: "1.5",
                    }}
                  >
                    {event.description}
                  </p>

                  <div className="event-map__popup-actions">
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="event-map__popup-link"
                    >
                      View Details <ExternalLink size={14} />
                    </a>

                    <MapDirectionsDropdown event={event} />
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </motion.div>
    </AnimatePresence>
  );
}

function MapDirectionsDropdown({ event }) {
  const [showDirections, setShowDirections] = useState(false);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDirections(false);
      }
    };
    if (showDirections) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDirections]);

  const handleDirectionClick = (provider) => {
    const address = encodeURIComponent(event.location);
    let url = "";
    if (provider === "google") {
      url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    } else {
      url = `https://maps.apple.com/?q=${address}&ll=${event.lat},${event.lng}&sll=${event.lat},${event.lng}`;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    setShowDirections(false);
  };

  return (
    <div className="event-card__directions" ref={dropdownRef}>
      <button
        className="event-card__directions-btn event-card__directions-btn--popup"
        onClick={() => setShowDirections(!showDirections)}
      >
        Directions
        <span
          className={`event-card__directions-arrow ${showDirections ? "open" : ""}`}
        >
          ▾
        </span>
      </button>
      {showDirections && (
        <div className="event-card__directions-menu event-card__directions-menu--popup">
          <button
            className="event-card__directions-item"
            onClick={() => handleDirectionClick("google")}
          >
            <img
              src="public/google-map-icon.png"
              alt=""
              className="event-card__directions-logo"
            />
            Google Maps
          </button>
          <button
            className="event-card__directions-item"
            onClick={() => handleDirectionClick("apple")}
          >
            <img
              src="public/Apple_Maps_Logo.png"
              alt=""
              className="event-card__directions-logo"
            />
            Apple Maps
          </button>
        </div>
      )}
    </div>
  );
}
