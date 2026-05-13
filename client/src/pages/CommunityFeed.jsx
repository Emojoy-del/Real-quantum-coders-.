import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import communityService from "../services/communityService";

const CommunityFeed = () => {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ title: "", body: "", tag: "Update" });

  const loadFeed = () => communityService.getFeed().then(setPosts);

  useEffect(() => {
    loadFeed();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await communityService.addPost(form, user);
    setForm({ title: "", body: "", tag: "Update" });
    loadFeed();
  };

  return (
    <main className="section page-shell community-layout">
      <section>
        <p className="eyebrow">Community</p>
        <h1>Community Feed</h1>
        <p className="muted">
          Share updates, event recaps, team calls, and stories from the IYF community.
        </p>

        <div className="feed-list">
          {posts.map((post) => (
            <article className="feed-post" key={post.id}>
              <div className="post-topline">
                <span className="pill">{post.tag}</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <h2>{post.title}</h2>
              <p>{post.body}</p>
              <strong>
                {post.author} · {post.role}
              </strong>
            </article>
          ))}
        </div>
      </section>

      <aside className="panel sticky-panel">
        <p className="eyebrow">Post</p>
        <h2>Share an update</h2>
        {isAuthenticated ? (
          <form className="panel-form flush-form" onSubmit={handleSubmit}>
            <label>
              Title
              <input
                required
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </label>
            <label>
              Type
              <select
                value={form.tag}
                onChange={(event) => setForm({ ...form, tag: event.target.value })}
              >
                <option>Update</option>
                <option>Volunteers</option>
                <option>Opportunity</option>
                <option>Tech</option>
                <option>Recap</option>
              </select>
            </label>
            <label>
              Message
              <textarea
                required
                rows="5"
                value={form.body}
                onChange={(event) => setForm({ ...form, body: event.target.value })}
              />
            </label>
            <button className="primary-button full-button" type="submit">
              Publish update
            </button>
          </form>
        ) : (
          <p className="muted">Login to post updates to the community feed.</p>
        )}
      </aside>
    </main>
  );
};

export default CommunityFeed;
