import React from "react";
import { Github, Linkedin, Globe, Twitter } from "lucide-react";

export default function AboutUs() {
  const team = [
    {
      name: "Reshama Shaikh",
      role: "Event Board Project Manager",
      org: "Data Umbrella",
      links: {
        twitter: "https://x.com/reshamas",
        github: "https://github.com/reshamas",
        linkedin: "https://www.linkedin.com/in/reshamas",
        web: "https://reshamas.github.io/",
      },
      image: "https://github.com/reshamas.png",
    },
    {
      name: "Joe Torreggiani",
      role: "Project Executive",
      org: "SPEC",
      links: {
        github: "https://github.com/jtorreggiani",
        linkedin: "https://www.linkedin.com/in/joetorreggiani/",
      },
      image: "https://github.com/jtorreggiani.png",
    },
    {
      name: "Ilia de Leon",
      role: "Design Lead",
      org: "SPEC",
      links: {
        github: "https://github.com/iliadeleon",
        linkedin: "https://www.linkedin.com/in/iliadeleon/",
      },
      image: "https://github.com/iliadeleon.png",
    },
    {
      name: "Yoline Banerjee",
      role: "Software Engineer",
      org: "SPEC",
      links: {
        github: "https://github.com/YolineB",
        linkedin: "https://www.linkedin.com/in/yolineb/",
      },
      image: "https://github.com/yolineb.png",
    },
    {
      name: "Victoria Lo",
      role: "Software Engineer",
      org: "SPEC",
      links: {
        github: "https://github.com/victoriaklo",
        linkedin: "https://www.linkedin.com/in/victoria-lo/",
      },
      image: "https://github.com/victorialo.png",
    },
    {
      name: "Crystal Shamsi",
      role: "Software Engineer",
      org: "SPEC",
      links: {
        github: "https://github.com/crystallynnvoss",
        linkedin: "https://www.linkedin.com/in/crystalshamsi/",
      },
      image: "https://github.com/crystalshamsi.png",
    },
  ];

  return (
    <main className="about-us">
      <section className="about-us__hero">
        <h2 className="about-us__title">About the Event Board</h2>
        <p className="about-us__description">
          This <strong>Data Events Board</strong> is a Data Umbrella
          initiative. This platform is for the community to share their events.
          In the spirit of open source, this event board has been built using
          open source software (Python, Django, React) and the application code
          is publicly available.
        </p>
      </section>

      <section className="about-us__sections">
        <h2 className="about-us__title">About Us</h2>
        <div className="about-us__cards">
          <div className="about-us__card glass-card">
            <img
              src="/du-event-board/DU_logo.png"
              alt="Data Umbrella"
              className="about-us__card-logo"
            />
            <h3 className="about-us__card-title">Data Umbrella</h3>
            <p className="about-us__card-text">
              <a
                href="https://www.dataumbrella.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                Data Umbrella
              </a>{" "}
              is a global non-profit community for underrepresented persons in
              data science that organizes data science events.
            </p>
            <p className="about-us__card-text">
              You can support Data Umbrella&apos;s work by making a donation to
              the{" "}
              <a
                href="https://opencollective.com/data-umbrella"
                target="_blank"
                rel="noopener noreferrer"
              >
                Data Umbrella Open Collective
              </a>
              .
            </p>
            <div className="about-us__card-socials">
              <a
                href="https://www.dataumbrella.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe size={20} />
              </a>
              <a
                href="https://twitter.com/dataumbrella"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter size={20} />
              </a>
              <a
                href="https://www.linkedin.com/company/dataumbrella/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          <div className="about-us__card glass-card">
            <img
              src="/du-event-board/SPEC.png"
              alt="SPEC"
              className="about-us__card-logo"
            />
            <h3 className="about-us__card-title">
              Sustainable Progress & Equality Collective
            </h3>
            <p className="about-us__card-text">
              <a
                href="https://specollective.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Sustainable Progress & Equality Collective (SPEC)
              </a>{" "}
              is an open learning organization that empowers individuals to be
              catalysts for positive change.
            </p>
            <p className="about-us__card-text">
              You can support SPEC&apos;s work by making a donation to the{" "}
              <a
                href="https://opencollective.com/spec"
                target="_blank"
                rel="noopener noreferrer"
              >
                SPEC Open Collective
              </a>
              .
            </p>
            <div className="about-us__card-socials">
              <a
                href="https://specollective.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe size={20} />
              </a>
              <a
                href="https://x.com/specollective"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter size={20} />
              </a>
              <a
                href="https://www.linkedin.com/company/specollective/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="about-us__team">
        <h2 className="about-us__title">We built this board</h2>
        <div className="about-us__team-grid">
          {team.map((member) => (
            <div key={member.name} className="team-card glass-card">
              <div className="team-card__image-wrapper">
                <img
                  src={member.image}
                  alt={member.name}
                  className="team-card__image"
                />
              </div>
              <h3 className="team-card__name">{member.name}</h3>
              <p className="team-card__role">{member.role}</p>
              <p className="team-card__org">{member.org}</p>
              <div className="team-card__socials">
                {member.links.twitter && (
                  <a
                    href={member.links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Twitter size={18} />
                  </a>
                )}
                {member.links.github && (
                  <a
                    href={member.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github size={18} />
                  </a>
                )}
                {member.links.linkedin && (
                  <a
                    href={member.links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin size={18} />
                  </a>
                )}
                {member.links.web && (
                  <a
                    href={member.links.web}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe size={18} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
