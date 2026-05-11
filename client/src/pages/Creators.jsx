import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import hubService from "../services/hubService";

const Creators = () => {
  const { isAuthenticated } = useAuth();
  const [creators, setCreators] = useState([]);

  const loadCreators = () => hubService.getCreators().then(setCreators);

  useEffect(() => {
    loadCreators();
  }, []);

  const handleFollow = async (creatorId) => {
    await hubService.toggleFollow(creatorId);
    loadCreators();
  };

  return (
    <main className="section page-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Creators and organizers</p>
          <h1>Follow the people behind the events</h1>
          <p className="muted">
            Keep up with organizers, clubs, and creative teams that shape the community.
          </p>
        </div>
      </div>

      <div className="hub-grid creator-grid">
        {creators.map((creator) => (
          <article className="hub-card" key={creator.id}>
            <span className="pill">{creator.type}</span>
            <h2>{creator.name}</h2>
            <p>{creator.focus}</p>
            <strong>{creator.followers.toLocaleString()} followers</strong>
            <button
              className={creator.followed ? "ghost-light-button full-button" : "primary-button full-button"}
              disabled={!isAuthenticated}
              onClick={() => handleFollow(creator.id)}
            >
              {creator.followed ? "Following" : isAuthenticated ? "Follow" : "Login to follow"}
            </button>
          </article>
        ))}
      </div>
    </main>
  );
};

export default Creators;
