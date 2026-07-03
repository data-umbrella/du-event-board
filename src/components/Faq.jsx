import React from "react";

export default function Faq({ onNavigate }) {
  return (
    <div className="faq-wrapper">
      <div className="faq-container">
        <h1 className="faq-title">FAQs</h1>

        <div className="faq-list">
          <div className="faq-item">
            <h3 className="faq-question">
              Q: I could not enter information into the form
            </h3>
            <p className="faq-answer">
              A: Fill out this{" "}
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigate) onNavigate("contact");
                }}
              >
                &quot;Contact Us&quot;
              </a>{" "}
              Form to report the issue
            </p>
          </div>

          <div className="faq-item">
            <h3 className="faq-question">
              Q: How can I contribute to this event board?
            </h3>
            <p className="faq-answer">
              A: The repositories for frontend and backend are on Github.
              <br />
              Contributions can be made there: <br />
              <a
                href="https://github.com/data-umbrella/du-event-board"
                target="_blank"
                rel="noopener noreferrer"
                className="faq-link mt-2 inline-block"
              >
                Frontend Repository
              </a>
              <br />
              <a
                href="https://github.com/data-umbrella/du-event-board-api"
                target="_blank"
                rel="noopener noreferrer"
                className="faq-link"
              >
                Backend Repository
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
