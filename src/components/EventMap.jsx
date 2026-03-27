import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ExternalLink, MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatEventDateRange } from "../utils/eventHelpers";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function toLabel(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function EventMap({ events }) {
  const firstMappedEvent = events.find((event) => event.lat && event.lng);
  const mapCenter = firstMappedEvent
    ? [firstMappedEvent.lat, firstMappedEvent.lng]
    : [-14.235, -51.925];

  const mapEvents = events.filter((event) => event.lat && event.lng);

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
      >
        <MapContainer center={mapCenter} zoom={4} className="map-container__frame">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {mapEvents.map((event) => (
            <Marker key={event.id} position={[event.lat, event.lng]}>
              <Popup className="premium-popup">
                <div className="map-popup">
                  <div className="map-popup__header">
                    <span className="event-card__category">{event.category}</span>
                    <span className="event-card__pill event-card__pill--muted">
                      {toLabel(event.event_type)}
                    </span>
                  </div>

                  <h3 className="map-popup__title">{event.title}</h3>

                  <div className="map-popup__meta">
                    <Calendar size={14} />
                    <span>
                      {formatEventDateRange(event.start_date || event.date, event.end_date)}{" "}
                      • {event.time}
                    </span>
                  </div>

                  <div className="map-popup__meta">
                    <MapPin size={14} />
                    <span>
                      {event.region}, {event.state}, {event.country}
                    </span>
                  </div>

                  <p className="map-popup__description">{event.description}</p>

                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-popup__link"
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
