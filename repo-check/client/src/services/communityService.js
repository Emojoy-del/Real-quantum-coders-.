import {
  communityGroups,
  feedPosts,
  opportunities,
  volunteerRoles,
} from "../data/community";

const GROUPS_KEY = "vibe_nation_joined_groups";
const VOLUNTEERS_KEY = "vibe_nation_volunteer_signups";
const FEED_KEY = "vibe_nation_feed_posts";

const readList = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

const writeList = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const communityService = {
  getFeed: async () => {
    return [...readList(FEED_KEY), ...feedPosts].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  },

  addPost: async (post, user) => {
    const nextPost = {
      id: `post-${Date.now()}`,
      author: user?.name || "Community Member",
      role: user?.role || "Member",
      createdAt: new Date().toISOString(),
      tag: post.tag || "Update",
      title: post.title,
      body: post.body,
    };
    writeList(FEED_KEY, [nextPost, ...readList(FEED_KEY)]);
    return nextPost;
  },

  getGroups: async () => {
    const joinedIds = readList(GROUPS_KEY);
    return communityGroups.map((group) => ({
      ...group,
      joined: joinedIds.includes(group.id),
    }));
  },

  joinGroup: async (groupId) => {
    const joinedIds = new Set(readList(GROUPS_KEY));
    joinedIds.add(groupId);
    writeList(GROUPS_KEY, [...joinedIds]);
  },

  leaveGroup: async (groupId) => {
    writeList(
      GROUPS_KEY,
      readList(GROUPS_KEY).filter((id) => id !== groupId)
    );
  },

  getOpportunities: async () => opportunities,

  getVolunteerRoles: async () => volunteerRoles,

  getVolunteerSignups: async () => readList(VOLUNTEERS_KEY),

  addVolunteerSignup: async (signup, user) => {
    const nextSignup = {
      id: `volunteer-${Date.now()}`,
      userName: user?.name || "Community Member",
      userEmail: user?.email || "",
      createdAt: new Date().toISOString(),
      ...signup,
    };
    writeList(VOLUNTEERS_KEY, [nextSignup, ...readList(VOLUNTEERS_KEY)]);
    return nextSignup;
  },
};

export default communityService;
