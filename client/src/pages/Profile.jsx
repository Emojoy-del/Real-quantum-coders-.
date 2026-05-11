import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import hubService from "../services/hubService";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    hubService.getProfile(user).then(setProfile);
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await hubService.saveProfile(profile);
    setSaved(true);
  };

  if (!profile) {
    return <main className="section page-shell">Loading profile...</main>;
  }

  return (
    <main className="section page-shell profile-layout">
      <section className="profile-card">
        <img src={profile.avatar} alt={profile.name} />
        <h1>{profile.name}</h1>
        <p>{profile.bio}</p>
        <div className="interest-row">
          {profile.interests.map((interest) => (
            <span className="pill" key={interest}>
              {interest}
            </span>
          ))}
        </div>
      </section>

      <form className="panel-form" onSubmit={handleSubmit}>
        <p className="eyebrow">Member profile</p>
        <h2>Edit your profile</h2>
        <label>
          Name
          <input
            value={profile.name}
            onChange={(event) => setProfile({ ...profile, name: event.target.value })}
          />
        </label>
        <label>
          Bio
          <textarea
            rows="4"
            value={profile.bio}
            onChange={(event) => setProfile({ ...profile, bio: event.target.value })}
          />
        </label>
        <label>
          Interests
          <input
            value={profile.interests.join(", ")}
            onChange={(event) =>
              setProfile({
                ...profile,
                interests: event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
        <label>
          Avatar image URL
          <input
            value={profile.avatar}
            onChange={(event) => setProfile({ ...profile, avatar: event.target.value })}
          />
        </label>
        <button className="primary-button full-button" type="submit">
          Save profile
        </button>
        {saved && <p className="success-message">Profile saved.</p>}
      </form>
    </main>
  );
};

export default Profile;
