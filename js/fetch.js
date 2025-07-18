// fetch.js
// Boss, this is your data acquisition layer for Reddit posts and subreddit suggestions.
// Uses in-memory cache, clean async interface, ready for UI import.

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch subreddit suggestions from Reddit API, with caching.
 * @param {string} query
 * @returns {Promise<Array<{name: string, icon: string}>>}
 */
export async function fetchSubreddits(query) {
  if (!query) return [];
  const cacheKey = `subs:${query}`;
  const now = Date.now();
  if (cache.has(cacheKey) && now - cache.get(cacheKey).timestamp < CACHE_TTL) {
    return cache.get(cacheKey).suggestions;
  }
  try {
    const url = `https://www.reddit.com/subreddits/search.json?q=${encodeURIComponent(query)}&limit=12&include_over_18=on`;
    const res = await fetch(url);
    const json = await res.json();
    const suggestions = (json.data?.children || []).map(({ data }) => ({
      name: data.display_name,
      icon: data.icon_img || (data.community_icon ? data.community_icon.split("?")[0] : "")
    }));
    cache.set(cacheKey, { suggestions, timestamp: now });
    return suggestions;
  } catch {
    return [];
  }
}

/**
 * Fetch Reddit posts from a subreddit, with sort, time, paging, and caching.
 * @param {object} opts - { subreddit, sort, time, after }
 * @returns {Promise<{posts: Array, after: string|null}>}
 */
export async function fetchPosts({ subreddit = "all", sort = "top", time = "day", after = null } = {}) {
  const cacheKey = `posts:${subreddit}:${sort}:${time}:${after || "init"}`;
  const now = Date.now();
  if (cache.has(cacheKey) && now - cache.get(cacheKey).timestamp < CACHE_TTL) {
    const { posts, after: cachedAfter } = cache.get(cacheKey);
    return { posts, after: cachedAfter };
  }

  try {
    const corsProxy = "https://corsproxy.io/?";
    const tParam = ["top", "controversial"].includes(sort) ? `&t=${time}` : "";
    const afterParam = after ? `&after=${after}` : "";
    const apiUrl = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=24${afterParam}${tParam}`;
    const url = corsProxy + encodeURIComponent(apiUrl);
    const res = await fetch(url);
    if (!res.ok) throw new Error("Reddit API returned " + res.status);
    const json = await res.json();
    if (!json.data || !Array.isArray(json.data.children)) {
      return { posts: [], after: null };
    }
    const posts = json.data.children.map((p) => {
      const d = p.data;
      const fb = d.media?.reddit_video?.fallback_url || d.secure_media?.reddit_video?.fallback_url || d.preview?.reddit_video_preview?.fallback_url || "";
      const prv = d.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, "&") || "";
      const thumb = d.thumbnail?.startsWith("http") ? d.thumbnail : prv;
      let videoUrl = "";
      if (fb) videoUrl = fb;
      else if (/\.(mp4|gifv|webm)$/i.test(prv)) videoUrl = prv.replace(".gifv", ".mp4");
      else videoUrl = "";
      const isVideo = !!videoUrl;
      return {
        title: d.title,
        isVideo,
        videoUrl,
        preview: prv,
        thumb: thumb || "",
        over_18: d.over_18,
        subreddit: d.subreddit,
        author: d.author,
        ups: d.ups,
        num_comments: d.num_comments
      };
    });
    const afterRes = json.data.after;
    cache.set(cacheKey, { posts, after: afterRes, timestamp: now });
    return { posts, after: afterRes };
  } catch (err) {
    console.error("fetchPosts error:", err);
    return { posts: [], after: null };
  }
}
