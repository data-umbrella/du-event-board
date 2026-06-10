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

export default function EventMap({ events, onSelectEvent, theme }) {
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
            url={
              theme === "dark"
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            }
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          <ZoomControl position="topright" />
          <MapController events={mapEvents} />

          {(() => {
            const groupedEvents = {};
            mapEvents.forEach((event) => {
              const key = `${event.lat},${event.lng}`;
              if (!groupedEvents[key]) {
                groupedEvents[key] = [];
              }
              groupedEvents[key].push(event);
            });

            return Object.values(groupedEvents).map((group, index) => (
              <Marker key={index} position={[group[0].lat, group[0].lng]}>
                <Popup className="premium-popup">
                  <div
                    style={{
                      minWidth: "220px",
                      maxHeight: "350px",
                      overflowY: "auto",
                      paddingRight: "4px",
                    }}
                  >
                    {group.length > 1 && (
                      <div
                        style={{
                          marginBottom: "12px",
                          padding: "6px 10px",
                          background: "var(--accent-primary)",
                          color: "white",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: "bold",
                          display: "inline-block",
                        }}
                      >
                        {group.length} Events Here
                      </div>
                    )}

                    {group.map((event, i) => (
                      <div
                        key={event.id}
                        style={{
                          marginBottom: i < group.length - 1 ? "16px" : "0",
                          borderBottom:
                            i < group.length - 1 ? "1px solid #eee" : "none",
                          paddingBottom: i < group.length - 1 ? "16px" : "0",
                        }}
                      >
                        <span
                          className="event-card__category"
                          style={{
                            marginBottom: "10px",
                            display: "inline-block",
                          }}
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
                          {(() => {
                            const formatDate = (dateStr) => {
                              if (!dateStr) return "";
                              try {
                                return new Date(
                                  dateStr + "T00:00:00",
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                });
                              } catch (e) {
                                return dateStr;
                              }
                            };
                            const formattedDate = formatDate(event.date);
                            const formattedEndDate = formatDate(
                              event.end_date,
                            );

                            const hasEndDate =
                              event.end_date && event.end_date !== event.date;
                            const hasTimes =
                              event.start_time && event.end_time;

                            let dateDisplay = formattedDate;
                            let displayTime = event.time;

                            if (hasEndDate) {
                              if (hasTimes) {
                                return `${formattedDate}, ${event.start_time} – ${formattedEndDate}, ${event.end_time}`;
                              } else {
                                return `${formattedDate} – ${formattedEndDate}`;
                              }
                            } else {
                              if (hasTimes) {
                                displayTime = `${event.start_time} – ${event.end_time}`;
                              } else {
                                displayTime = event.time || event.start_time;
                              }
                            }
                            return displayTime
                              ? `${dateDisplay} • ${displayTime}`
                              : dateDisplay;
                          })()}
                        </div>

                        <a
                          href={`?page=event-details&eventId=${event.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            onSelectEvent(event.id);
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            textDecoration: "none",
                            backgroundColor: "#7c5cfc",
                            color: "white",
                            padding: "8px 16px",
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: "600",
                            transition: "all 0.2s",
                            width: "100%",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          View Details <ExternalLink size={14} />
                        </a>
                      </div>
                    ))}
                  </div>
                </Popup>
              </Marker>
            ));
          })()}
        </MapContainer>
      </motion.div>
    </AnimatePresence>
  );
}
