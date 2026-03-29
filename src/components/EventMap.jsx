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

// Keep the map focused on relevant events, then refine with geolocation if available.
function MapController({ events }) {
  const map = useMap();
  const locationCircleRef = React.useRef(null);
  const [hasLocated, setHasLocated] = useState(false);

  useEffect(() => {
    if (events.length > 0 && !hasLocated) {
      const bounds = L.latLngBounds(
        events.map((event) => [event.lat, event.lng]),
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 7 });
    }

    if (!hasLocated) {
      map.locate({ setView: true, maxZoom: 8 });
    }

    const onLocationFound = (event) => {
      setHasLocated(true);

      if (locationCircleRef.current) {
        map.removeLayer(locationCircleRef.current);
      }

      locationCircleRef.current = L.circle(event.latlng, {
        radius: event.accuracy,
        color: "var(--accent-primary)",
        fillColor: "var(--accent-primary)",
        fillOpacity: 0.1,
        weight: 1,
      }).addTo(map);
    };

    const onLocationError = () => {
      console.warn("Geolocation fallback: showing entire map view.");
      setHasLocated(true);

      if (events.length > 0) {
        const bounds = L.latLngBounds(
          events.map((event) => [event.lat, event.lng]),
        );
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
  const mapEvents = events.filter((event) => event.lat && event.lng);

  if (mapEvents.length === 0) {
    return (
      <div className="empty-state" id="empty-state">
        <div className="empty-state__icon">Map</div>
        <h2 className="empty-state__title">No locations found</h2>
        <p className="empty-state__description">
          None of the filtered events have map coordinates available.
        </p>
      </div>
    );
  }

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
      >
        <MapContainer
          center={initialCenter}
          zoom={initialZoom}
          zoomControl={false}
          className="map-container__frame"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution={
              '&copy; <a href="https://www.openstreetmap.org/copyright">' +
              "OpenStreetMap</a> contributors &copy; " +
              '<a href="https://carto.com/attributions">CARTO</a>'
            }
          />

          <ZoomControl position="topright" />
          <MapController events={mapEvents} />

          {mapEvents.map((event) => (
            <Marker key={event.id} position={[event.lat, event.lng]}>
              <Popup className="premium-popup">
                <div className="map-popup">
                  <div className="map-popup__header">
                    <span className="event-card__category">
                      {event.category}
                    </span>
                    <span className="event-card__pill event-card__pill--muted">
                      {toLabel(event.event_type)}
                    </span>
                  </div>

                  <h3 className="map-popup__title">{event.title}</h3>

                  <div className="map-popup__meta">
                    <Calendar size={14} />
                    <span>
                      {formatEventDateRange(
                        event.start_date || event.date,
                        event.end_date,
                      )}{" "}
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
