import { useParams } from "react-router-dom";
import { useState } from "react";
import events from "../data/events.json";
import { FaGlobe, FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa";

function formatDate(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function EventDetailPage() {
  const { id } = useParams();
  const event = events.find((e) => e.id === id);

  const [imgError, setImgError] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  if (!event) return <h2>Event not found</h2>;

  return (
    <div className="event-page">
      <div className="event-container">
        <div className="event-hero">
          <div className="event-info">
            <span className="event-category">{event.category}</span>

            <h1 className="event-title">{event.title}</h1>

            <p className="event-org">by {event.org}</p>

            <div className="event-tags">
              {event.tags.map((tag) => (
                <span key={tag} className="event-tag">
                  #{tag}
                </span>
              ))}
            </div>

            <p className="event-desc">{event.description}</p>

            {event.socials && (
              <div className="event-socials">
                {event.socials.website && (
                  <a
                    href={event.socials.website}
                    target="_blank"
                    className="social-icon"
                    rel="noopener noreferrer"
                  >
                    <FaGlobe />
                  </a>
                )}

                {event.socials.twitter && (
                  <a
                    href={event.socials.twitter}
                    target="_blank"
                    className="social-icon"
                    rel="noopener noreferrer"
                  >
                    <FaTwitter />
                  </a>
                )}

                {event.socials.linkedin && (
                  <a
                    href={event.socials.linkedin}
                    target="_blank"
                    className="social-icon"
                    rel="noopener noreferrer"
                  >
                    <FaLinkedin />
                  </a>
                )}

                {event.socials.instagram && (
                  <a
                    href={event.socials.instagram}
                    target="_blank"
                    className="social-icon"
                    rel="noopener noreferrer"
                  >
                    <FaInstagram />
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="event-poster">
            {!imgError ? (
              <img
                src={`${import.meta.env.BASE_URL}${event.poster}`}
                onError={() => setImgError(true)}
                alt="poster"
              />
            ) : (
              <div className="poster-fallback">No Image</div>
            )}
          </div>
        </div>

        <div className="event-body">
          <div className="event-details-card">
            <h3 className="details-title">Event Details</h3>
            <div className="card-row">
              <span>📅 Date</span>
              <span>{formatDate(event.date)}</span>
            </div>

            <div className="card-row">
              <span>⏰ Time</span>
              <span>{event.time}</span>
            </div>

            <div className="card-row">
              <span>📍 Location</span>
              <span>{event.location}</span>
            </div>

            <div className="card-row">
              <span>🌐 Mode</span>
              <span>{event.mode}</span>
            </div>
          </div>

          <div className="event-card">
            <div className="event-card-top">
              <div className="card-row">
                <span>Organizer</span>
                <span>{event.org || "Not specified"}</span>
              </div>

              <div className="card-row">
                <span>Mode</span>
                <span>{event.mode || "N/A"}</span>
              </div>

              <div className="card-row">
                <span>Registrations</span>
                <span>{event.registrations || "Open"}</span>
              </div>

              <div className="card-row">
                <span>Deadline</span>
                <span>{event.deadline || "Not announced"}</span>
              </div>
            </div>

            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="event-btn"
            >
              Apply Now →
            </a>
          </div>
        </div>

        <div className="tabs-wrapper">
          <div className="tabs-header">
            {["overview", "schedule", "prizes", "faq", "contact"].map(
              (tab) => (
                <button
                  key={tab}
                  className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ),
            )}
          </div>

          <div className="tabs-content">
            {activeTab === "overview" && (
              <div className="tab-panel">
                <h3>Overview</h3>
                <p>{event.overview}</p>
              </div>
            )}

            {activeTab === "schedule" && (
              <div className="tab-panel">
                <h3>Schedule</h3>
                {event.schedule?.map((item, i) => (
                  <div key={i} className="tab-item">
                    <span>⏱</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "prizes" && (
              <div className="tab-panel">
                <h3>Prizes</h3>
                {event.prizes?.map((item, i) => (
                  <div key={i} className="tab-item">
                    <span>🏆</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "faq" && (
              <div className="tab-panel">
                <h3>FAQ</h3>
                {event.faq?.map((item, i) => (
                  <div key={i} className="tab-item">
                    <span>❓</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "contact" && (
              <div className="tab-panel">
                <h3>Contact</h3>

                <div className="tab-item">
                  <span>📧</span>
                  <p>{event.contact?.email}</p>
                </div>

                <div className="tab-item">
                  <span>📞</span>
                  <p>{event.contact?.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
