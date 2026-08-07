import React from "react";

export default function ContactUs({ onNavigate }) {
  return (
    <div className="contact-us-wrapper">
      <div className="contact-us-container">
        <h1 className="contact-us-title">Contact Us</h1>

        <div className="contact-us-content">
          <p className="contact-us-description">
            For feature suggestions, bug reports, etc for the Event Board,
            please open up an issue here:
            <br />
            <a
              href="https://github.com/data-umbrella/du-event-board"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://github.com/data-umbrella/du-event-board
            </a>
          </p>

          <p className="contact-us-description mt-4">
            For Inquiries related to sponsorship, technical issues, or other,
            please complete this form:
          </p>

          <form
            className="contact-us-form"
            action="https://formspree.io/f/form_id"
            method="POST"
          >
            <div className="form-group-row">
              <div className="form-group w-50">
                <label htmlFor="name">Name*</label>
                <input type="text" id="name" name="name" required />
              </div>
            </div>

            <div className="form-group-row two-col">
              <div className="form-group w-50">
                <label htmlFor="email">Email*</label>
                <input type="email" id="email" name="email" required />
              </div>
              <div className="form-group w-50">
                <label htmlFor="topic">Topic</label>
                <select id="topic" name="topic">
                  <option value=""></option>
                  <option value="Sponsorship">Sponsorship</option>
                  <option value="Technical Issue">Technical Issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="referral">
                How did you find out about this Event Board?*
              </label>
              <input type="text" id="referral" name="referral" required />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message*</label>
              <textarea
                id="message"
                name="message"
                rows="8"
                required
              ></textarea>
            </div>

            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="code-of-conduct"
                name="code-of-conduct"
                required
              />
              <label htmlFor="code-of-conduct">
                All communication must adhere to our{" "}
                <a
                  href="https://github.com/data-umbrella/du-event-board/blob/main/CODE_OF_CONDUCT.md"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Code of Conduct
                </a>{" "}
                and{" "}
                <a
                  href="#privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate("privacy");
                  }}
                >
                  Privacy Policy
                </a>
                *
              </label>
            </div>

            <div className="form-submit-container">
              <button type="submit" className="form-submit-btn">
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
