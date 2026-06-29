import React from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Globe,
  ExternalLink,
  Linkedin,
  Twitter,
  Languages,
  Building,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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

export default function EventDetails({ event, onBack }) {
  if (!event) return null;

  // Extract fields with fallbacks
  const title = event.title || event.event_name;
  const description = event.description || event.event_description;
  const date = event.date || event.start_date;
  const endDate = event.end_date;
  const time = event.time;
  const location = event.location;
  const region = event.region;
  const city = event.city;
  const state = event.state || event.province;
  const country = event.country;
  const category = event.category || event.event_type;
  const url = event.url || event.event_url;
  const tags = event.tags || [];
  const imageUrl = event.image_url;
  const organizationName = event.organization_name;
  const organizationUrl = event.organization_url;
  const urlLinkedin = event.url_linkedin;
  const urlTwitter = event.url_twitter;
  const urlOther = event.url_other;
  const acronym = event.acronym;
  const paidOrFree = event.paid_or_free;
  const inPerson = event.in_person;
  const virtual = event.virtual;
  const language = event.language;
  const lat = event.lat;
  const lng = event.lng;
  const startTime = event.start_time;
  const endTime = event.end_time;

  // Format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formattedDate = formatDate(date);
  const formattedEndDate = formatDate(endDate);
  const dateDisplay =
    endDate && endDate !== date
      ? `${formattedDate} – ${formattedEndDate}`
      : formattedDate;

  // Format time display
  let timeDisplay = "";
  if (startTime && endTime) {
    if (endDate && endDate !== date) {
      // Multi-day event with start/end times
      timeDisplay = `Starts: ${formattedDate} at ${startTime}\nEnds: ${formattedEndDate} at ${endTime}`;
    } else {
      // Single day event with start/end times
      timeDisplay = `${startTime} – ${endTime}`;
    }
  } else if (startTime) {
    timeDisplay = `Starts: ${startTime}`;
  } else if (endTime) {
    timeDisplay = `Ends: ${endTime}`;
  } else if (time) {
    timeDisplay = time;
  }

  // Determine coordinates availability
  const hasCoords = lat !== undefined && lng !== undefined;

  // Determine format badges
  let formatBadge = "";
  if (inPerson === "Yes" && virtual === "Yes") {
    formatBadge = "Hybrid";
  } else if (inPerson === "Yes") {
    formatBadge = "In-Person";
  } else if (virtual === "Yes") {
    formatBadge = "Virtual";
  } else if (location && location.toLowerCase() === "online") {
    formatBadge = "Virtual";
  }

  // Cost status display
  const hasCost = !!paidOrFree;
  const isPaid = paidOrFree && paidOrFree.toLowerCase() === "paid";
  const costLabel = paidOrFree
    ? paidOrFree.charAt(0).toUpperCase() + paidOrFree.slice(1)
    : "";

  return (
    <main className="event-details" id={`event-details-${event.id}`}>
      {/* Back navigation */}
      <div className="event-details__navigation">
        <button onClick={onBack} className="btn-back" id="back-to-events-btn">
          <ArrowLeft size={16} /> Back to Events
        </button>
      </div>

      <div className="event-details__container">
        {/* Left Column: Event Body */}
        <section className="event-details__main-content">
          {imageUrl && (
            <div className="event-details__banner-wrapper">
              <img
                src={imageUrl}
                alt={title}
                className="event-details__banner"
              />
            </div>
          )}

          <div className="event-details__body glass-card">
            {acronym && (
              <span className="event-details__acronym">{acronym}</span>
            )}
            <h2 className="event-details__title">{title}</h2>

            {/* Badges Row */}
            <div className="event-details__badges">
              <span className="event-details__badge event-details__badge--category">
                {category}
              </span>
              {hasCost && (
                <span
                  className={`event-details__badge ${
                    isPaid
                      ? "event-details__badge--paid"
                      : "event-details__badge--free"
                  }`}
                >
                  {costLabel}
                </span>
              )}
              {formatBadge && (
                <span className="event-details__badge event-details__badge--format">
                  {formatBadge}
                </span>
              )}
              {language && (
                <span className="event-details__badge event-details__badge--lang">
                  <Languages
                    size={12}
                    style={{ marginRight: "4px", verticalAlign: "middle" }}
                  />
                  {language}
                </span>
              )}
            </div>

            <div className="event-details__divider"></div>

            {/* Description */}
            <div className="event-details__description-section">
              <h3 className="event-details__section-title">
                About this Event
              </h3>
              <p className="event-details__description">{description}</p>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="event-details__tags-section">
                <h4 className="event-details__tags-title">Tags</h4>
                <div className="event-details__tags">
                  {tags.map((tag) => (
                    <span key={tag} className="event-card__tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Event Info Cards */}
        <aside className="event-details__sidebar">
          {/* Main Info Card */}
          <div className="event-details__info-card glass-card">
            <h3 className="event-details__sidebar-title">Date & Time</h3>
            <div className="event-details__sidebar-item">
              <Calendar size={18} className="event-details__sidebar-icon" />
              <div>
                <p className="event-details__sidebar-label">Date</p>
                <p className="event-details__sidebar-value">{dateDisplay}</p>
              </div>
            </div>

            {timeDisplay && (
              <div className="event-details__sidebar-item">
                <Clock size={18} className="event-details__sidebar-icon" />
                <div>
                  <p className="event-details__sidebar-label">Time</p>
                  {timeDisplay.split("\n").map((line, idx) => (
                    <p key={idx} className="event-details__sidebar-value">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="event-details__divider"></div>

            <h3 className="event-details__sidebar-title">Location</h3>
            <div className="event-details__sidebar-item">
              <MapPin size={18} className="event-details__sidebar-icon" />
              <div>
                <p className="event-details__sidebar-label">Venue</p>
                <p className="event-details__sidebar-value">{location}</p>
              </div>
            </div>

            {city && (
              <div className="event-details__sidebar-item">
                <MapPin
                  size={18}
                  className="event-details__sidebar-icon"
                  style={{ opacity: 0 }}
                />
                <div>
                  <p className="event-details__sidebar-label">City</p>
                  <p className="event-details__sidebar-value">{city}</p>
                </div>
              </div>
            )}

            {state && (
              <div className="event-details__sidebar-item">
                <MapPin
                  size={18}
                  className="event-details__sidebar-icon"
                  style={{ opacity: 0 }}
                />
                <div>
                  <p className="event-details__sidebar-label">
                    State/Province
                  </p>
                  <p className="event-details__sidebar-value">{state}</p>
                </div>
              </div>
            )}

            {country && (
              <div className="event-details__sidebar-item">
                <Globe
                  size={18}
                  className="event-details__sidebar-icon"
                  style={{ opacity: 0 }}
                />
                <div>
                  <p className="event-details__sidebar-label">Country</p>
                  <p className="event-details__sidebar-value">{country}</p>
                </div>
              </div>
            )}

            {region && (
              <div className="event-details__sidebar-item">
                <Globe size={18} className="event-details__sidebar-icon" />
                <div>
                  <p className="event-details__sidebar-label">Region</p>
                  <p className="event-details__sidebar-value">{region}</p>
                </div>
              </div>
            )}

            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="event-details__cta-btn"
                id="event-register-cta"
              >
                Learn More <ExternalLink size={16} />
              </a>
            )}
          </div>

          {/* Organizer Details Card */}
          {organizationName && (
            <div className="event-details__org-card glass-card">
              <h3 className="event-details__sidebar-title">Organizer</h3>
              <div className="event-details__sidebar-item">
                <Building size={18} className="event-details__sidebar-icon" />
                <div>
                  <p
                    className="event-details__sidebar-value"
                    style={{ fontWeight: 600 }}
                  >
                    {organizationName}
                  </p>
                  {organizationUrl && (
                    <a
                      href={organizationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="event-details__org-link"
                    >
                      Visit Website <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>

              {/* Social links */}
              {(urlLinkedin || urlTwitter || urlOther) && (
                <div className="event-details__socials">
                  {urlLinkedin && (
                    <a
                      href={urlLinkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="event-details__social-btn"
                      aria-label="LinkedIn"
                    >
                      <Linkedin size={18} />
                    </a>
                  )}
                  {urlTwitter && (
                    <a
                      href={urlTwitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="event-details__social-btn"
                      aria-label="Twitter"
                    >
                      <Twitter size={18} />
                    </a>
                  )}
                  {urlOther && (
                    <a
                      href={urlOther}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="event-details__social-btn"
                      aria-label="Website"
                    >
                      <Globe size={18} />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Leaflet Mini Map */}
          {hasCoords && (
            <div className="event-details__map-card glass-card">
              <h3 className="event-details__sidebar-title">
                Event Map Location
              </h3>
              <div className="event-details__map-wrapper">
                <MapContainer
                  center={[lat, lng]}
                  zoom={12}
                  zoomControl={true}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <Marker position={[lat, lng]}>
                    <Popup>{title}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
