// login.js
const CLIENT_ID = "<YOUR_REDDIT_APP_CLIENT_ID>";
const REDIRECT_URI = "http://localhost:8181/auth_callback";
const SCOPES = "identity read";
const STATE_KEY = "wettit-login-state";
const TOKEN_KEY = "wettit-oauth-token";

// -- Helper: Build login URL --
export function getLoginUrl() {
  const state = Math.random().toString(36).slice(2);
  localStorage.setItem(STATE_KEY, state);
  return `https://www.reddit.com/api/v1/authorize?client_id=${CLIENT_ID}&response_type=token&state=${state}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&duration=permanent&scope=${encodeURIComponent(SCOPES)}`;
}

// -- Start login flow: opens popup --
export function startLogin() {
  const url = getLoginUrl();
  window.open(url, "RedditLogin", "width=570,height=630");
}

// -- Check URL for token (call on load) --
export function checkForAuthToken() {
  const hash = window.location.hash;
  if (hash.includes("access_token")) {
    const params = new URLSearchParams(hash.slice(1));
    const state = params.get("state");
    if (state !== localStorage.getItem(STATE_KEY)) return;
    const token = params.get("access_token");
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      window.location.hash = ""; // Clean URL
      window.location.reload();
    }
  }
}

// -- Logout --
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  window.location.reload();
}

// -- Get token (or null) --
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

// -- Fetch user info using token --
export async function fetchUserInfo() {
  const token = getToken();
  if (!token) return null;
  const res = await fetch("https://oauth.reddit.com/api/v1/me", {
    headers: { Authorization: "bearer " + token }
  });
  if (!res.ok) return null;
  return await res.json();
}

