import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import communityService from "../services/communityService";

const Groups = () => {
  const { isAuthenticated } = useAuth();
  const [groups, setGroups] = useState([]);

  const loadGroups = () => communityService.getGroups().then(setGroups);

  useEffect(() => {
    loadGroups();
  }, []);

  const toggleGroup = async (group) => {
    if (group.joined) {
      await communityService.leaveGroup(group.id);
    } else {
      await communityService.joinGroup(group.id);
    }
    loadGroups();
  };

  return (
    <main className="section page-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Belong</p>
          <h1>Groups</h1>
          <p className="muted">Join teams and circles that match your interests.</p>
        </div>
      </div>

      <div className="hub-grid">
        {groups.map((group) => (
          <article className="hub-card" key={group.id}>
            <span className="pill">{group.members + (group.joined ? 1 : 0)} members</span>
            <h2>{group.name}</h2>
            <p>{group.focus}</p>
            <strong>{group.meeting}</strong>
            <button
              className={group.joined ? "ghost-light-button full-button" : "primary-button full-button"}
              onClick={() => toggleGroup(group)}
              disabled={!isAuthenticated}
            >
              {group.joined ? "Joined" : isAuthenticated ? "Join group" : "Login to join"}
            </button>
          </article>
        ))}
      </div>
    </main>
  );
};

export default Groups;
