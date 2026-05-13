import { creators, mediaPosts, notifications } from "../data/hub";

const FOLLOWS_KEY = "iyf_followed_creators";
const COMMENTS_KEY = "iyf_event_comments";
const MEDIA_KEY = "iyf_media_posts";
const PROFILE_KEY = "iyf_member_profile";
const NOTIFICATIONS_READ_KEY = "iyf_read_notifications";

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const hubService = {
  getProfile: async (user) => {
    const savedProfile = readJson(PROFILE_KEY, null);
    return {
      name: user?.name || "Community Member",
      email: user?.email || "",
      bio: "I am here to discover events, grow skills, and serve the community.",
      interests: ["Events", "Volunteering", "Mentorship"],
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
      ...savedProfile,
    };
  },

  saveProfile: async (profile) => {
    writeJson(PROFILE_KEY, profile);
    return profile;
  },

  getCreators: async () => {
    const followed = readJson(FOLLOWS_KEY, []);
    return creators.map((creator) => ({
      ...creator,
      followed: followed.includes(creator.id),
      followers: creator.followers + (followed.includes(creator.id) ? 1 : 0),
    }));
  },

  toggleFollow: async (creatorId) => {
    const followed = readJson(FOLLOWS_KEY, []);
    const nextFollowed = followed.includes(creatorId)
      ? followed.filter((id) => id !== creatorId)
      : [...followed, creatorId];
    writeJson(FOLLOWS_KEY, nextFollowed);
  },

  getComments: async (eventId) => {
    const comments = readJson(COMMENTS_KEY, {});
    return comments[eventId] || [];
  },

  addComment: async (eventId, body, user) => {
    const comments = readJson(COMMENTS_KEY, {});
    const nextComment = {
      id: `comment-${Date.now()}`,
      author: user?.name || "Community Member",
      body,
      createdAt: new Date().toISOString(),
    };
    writeJson(COMMENTS_KEY, {
      ...comments,
      [eventId]: [nextComment, ...(comments[eventId] || [])],
    });
    return nextComment;
  },

  getNotifications: async () => {
    const readIds = readJson(NOTIFICATIONS_READ_KEY, []);
    return notifications.map((item) => ({
      ...item,
      read: readIds.includes(item.id),
    }));
  },

  markNotificationRead: async (notificationId) => {
    const readIds = new Set(readJson(NOTIFICATIONS_READ_KEY, []));
    readIds.add(notificationId);
    writeJson(NOTIFICATIONS_READ_KEY, [...readIds]);
  },

  getMedia: async () => {
    return [...readJson(MEDIA_KEY, []), ...mediaPosts].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  },

  addMedia: async (media, user) => {
    const nextMedia = {
      id: `media-${Date.now()}`,
      author: user?.name || "Community Member",
      createdAt: new Date().toISOString(),
      ...media,
    };
    writeJson(MEDIA_KEY, [nextMedia, ...readJson(MEDIA_KEY, [])]);
    return nextMedia;
  },
};

export default hubService;
