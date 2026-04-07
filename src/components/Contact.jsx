import React from "react";
import {
  Mail,
  MessageSquare,
  MapPin,
  Send,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";

const Contact = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="contact-page animate-fadeIn">
      <section className="contact-hero">
        <h1 className="contact-title">Get in Touch</h1>
        <p className="contact-description">
          Have questions about Data Umbrella events or want to collaborate?
          We&apos;re here to help you connect with the community.
        </p>
      </section>

      <div className="contact-container">
        {/* Contact Info Cards */}
        <div className="contact-info">
          <div className="contact-info-card glass-card">
            <div className="contact-icon-wrapper">
              <Mail className="contact-icon" />
            </div>
            <h3>Email Us</h3>
            <p>info@dataumbrella.org</p>
          </div>

          <div className="contact-info-card glass-card">
            <div className="contact-icon-wrapper">
              <MessageSquare className="contact-icon" />
            </div>
            <h3>Community</h3>
            <p>Join our Discord or Slack channels for real-time help.</p>
          </div>

          <div className="contact-info-card glass-card">
            <div className="contact-icon-wrapper">
              <MapPin className="contact-icon" />
            </div>
            <h3>Location</h3>
            <p>Global / Remote Friendly</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="contact-form-wrapper glass-card">
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email address"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <select id="subject">
                <option value="general">General Inquiry</option>
                <option value="event">Event Support</option>
                <option value="partnership">Partnership</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                rows="5"
                placeholder="How can we help you?"
                required
              ></textarea>
            </div>

            <button type="submit" className="contact-submit-btn">
              <span>Send Message</span>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
