import React from "react";

export default function Faq({ onNavigate }) {
  return (
    <main className="faq-wrapper">
      <div className="faq-container">
        <h1 className="faq-title">FAQs</h1>

        <div className="faq-list">
          <div className="faq-item">
            <h2 className="faq-question">
              Q: I could not enter information into the form
            </h2>
            <p className="faq-answer">
              A: Fill out the{" "}
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigate) onNavigate("contact");
                }}
                className="faq-link"
              >
                contact form
              </a>{" "}
              to report the issue
            </p>
          </div>

          <div className="faq-item">
            <h2 className="faq-question">
              Q: How can I contribute to this event board?
            </h2>
            <p className="faq-answer">
              A: The project repository is on GitHub.
              <br />
              Contributions can be made there: <br />
              <a
                href="https://github.com/data-umbrella/du-event-board"
                target="_blank"
                rel="noopener noreferrer"
                className="faq-link mt-2 inline-block"
              >
                Project Repository
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
