import React, { useEffect, useState } from "react";
import communityService from "../services/communityService";

const Opportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [interested, setInterested] = useState({});

  useEffect(() => {
    communityService.getOpportunities().then(setOpportunities);
  }, []);

  return (
    <main className="section page-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Grow</p>
          <h1>Opportunities Board</h1>
          <p className="muted">
            Training, mentorship, volunteer openings, and community chances in one place.
          </p>
        </div>
      </div>

      <div className="opportunity-list">
        {opportunities.map((opportunity) => (
          <article className="opportunity-card" key={opportunity.id}>
            <div>
              <span className="pill">{opportunity.type}</span>
              <h2>{opportunity.title}</h2>
              <p>{opportunity.description}</p>
              <div className="details-meta inline-meta">
                <span>{opportunity.location}</span>
                <span>Deadline {new Date(opportunity.deadline).toLocaleDateString()}</span>
              </div>
            </div>
            <button
              className={interested[opportunity.id] ? "ghost-light-button" : "primary-button"}
              onClick={() =>
                setInterested({ ...interested, [opportunity.id]: !interested[opportunity.id] })
              }
            >
              {interested[opportunity.id] ? "Marked interested" : "I'm interested"}
            </button>
          </article>
        ))}
      </div>
    </main>
  );
};

export default Opportunities;
