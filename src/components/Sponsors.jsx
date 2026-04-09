import React from "react";

export default function Sponsors() {
  const sponsors = [
    {
      name: "CZI",
      fullName: "Chan Zuckerberg Initiative",
      logo: "/du-event-board/ChanZuckerberg.png",
      url: "https://chanzuckerberg.com/",
    },
  ];

  return (
    <main className="sponsors">
      <section className="sponsors__hero">
        <h2 className="sponsors__title">Thank you to our Sponsors!</h2>
        <p className="sponsors__description">
          If you would like to sponsor this Event Board, please submit a form{" "}
          <a
            href="https://www.dataumbrella.org/about/sponsors"
            className="sponsors__form-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            here
          </a>
          .
        </p>
      </section>

      <section className="sponsors__grid">
        {sponsors.map((sponsor) => (
          <div key={sponsor.name} className="sponsor-card glass-card">
            <div className="sponsor-card__logo-container">
              {sponsor.prefix && (
                <span className="sponsor-card__prefix">{sponsor.prefix}</span>
              )}
              <img
                src={sponsor.logo}
                alt={sponsor.fullName}
                className="sponsor-card__logo"
              />
            </div>
            <h3 className="sponsor-card__name">{sponsor.name}</h3>
          </div>
        ))}
      </section>
    </main>
  );
}
