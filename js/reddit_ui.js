// reddit_ui.js
import { css } from "./style.js";
import { settings, saveSetting, applyTheme } from "./settings.js";
import { sendToWorkflow } from "./send_to_workflow.js";

// Tiny DOM util
const $ = (tag, style = {}, props = {}) => {
  const el = document.createElement(tag);
  Object.assign(el.style, style);
  Object.assign(el, props);
  return el;
};

export function renderSidebar(el) {
  let after = null, loading = false, posts = [];
  const container = $("div", css.container); el.appendChild(container);

  // ---- THEME & SETTINGS ----
  const themeBtn = $("button", css.themeToggle, { title: "Toggle theme", innerHTML: settings.theme === "light" ? "🌞" : "🌚" });
  themeBtn.onclick = () => {
    const newTheme = settings.theme === "light" ? "dark" : "light";
    saveSetting("theme", newTheme); applyTheme(newTheme);
    themeBtn.innerHTML = newTheme === "light" ? "🌞" : "🌚";
    fetchPosts(false);
  };
  container.appendChild(themeBtn);

  // Settings button + modal
  const settingsBtn = $("button", css.settingsBtn, { innerHTML: "⚙️", title: "Settings" });
  container.appendChild(settingsBtn);
  let modalBg = null;
  function showSettingsModal() {
    if (modalBg) return;
    modalBg = $("div", css.modalBg);
    const modal = $("div", css.modal);
    modal.appendChild($("div", css.modalTitle, { innerText: "Settings" }));

    // Theme
    const rowTheme = $("div", css.modalRow);
    rowTheme.append(
      $("span", css.modalLabel, { innerText: "Theme" }),
      (() => {
        const select = document.createElement("select");
        select.style.padding = "4px 8px";
        select.style.fontSize = "14px";
        ["dark", "light"].forEach(v => {
          const opt = document.createElement("option");
          opt.value = v; opt.innerText = v.charAt(0).toUpperCase() + v.slice(1);
          if (settings.theme === v) opt.selected = true;
          select.appendChild(opt);
        });
        select.onchange = () => {
          saveSetting("theme", select.value);
          applyTheme(select.value);
          fetchPosts(false);
          themeBtn.innerHTML = select.value === "light" ? "🌞" : "🌚";
        };
        return select;
      })()
    );
    modal.appendChild(rowTheme);

    // Autoplay
    const rowAuto = $("div", css.modalRow);
    rowAuto.append(
      $("span", css.modalLabel, { innerText: "Autoplay Videos" }),
      (() => {
        const chk = document.createElement("input");
        chk.type = "checkbox";
        chk.checked = !!settings.autoplay;
        chk.onchange = () => { saveSetting("autoplay", chk.checked); fetchPosts(false); };
        return chk;
      })()
    );
    modal.appendChild(rowAuto);

    // NSFW Blur
    const rowNSFW = $("div", css.modalRow);
    rowNSFW.append(
      $("span", css.modalLabel, { innerText: "Blur NSFW Thumbnails" }),
      (() => {
        const chk = document.createElement("input");
        chk.type = "checkbox";
        chk.checked = !!settings.nsfwBlur;
        chk.onchange = () => { saveSetting("nsfwBlur", chk.checked); fetchPosts(false); };
        return chk;
      })()
    );
    modal.appendChild(rowNSFW);

    // Cards per Row
    const rowCards = $("div", css.modalRow);
    rowCards.append(
      $("span", css.modalLabel, { innerText: "Cards per Row" }),
      (() => {
        const select = document.createElement("select");
        for (let i = 2; i <= 5; ++i) {
          const opt = document.createElement("option");
          opt.value = i; opt.innerText = i;
          if (+settings.cardsPerRow === i) opt.selected = true;
          select.appendChild(opt);
        }
        select.onchange = () => { saveSetting("cardsPerRow", +select.value); fetchPosts(false); };
        return select;
      })()
    );
    modal.appendChild(rowCards);

    // Close
    const closeBtn = $("button", css.modalClose, { innerText: "×" });
    closeBtn.onclick = () => { modalBg.remove(); modalBg = null; };
    modal.appendChild(closeBtn);
    modalBg.appendChild(modal); document.body.appendChild(modalBg);
    setTimeout(() => { Object.assign(modalBg.style, css.modalBgVisible); }, 10);
    modalBg.onclick = e => { if (e.target === modalBg) { modalBg.remove(); modalBg = null; } };
  }
  settingsBtn.onclick = showSettingsModal;

  // ---- HEADER ----
  const header = $("div", css.header);
  header.innerHTML = `<h1 style="${Object.entries(css.logo).map(([k,v])=>`${k}:${v}`).join(";")}">🔥 Reddit Browser</h1>
  <p style="${Object.entries(css.subtitle).map(([k,v])=>`${k}:${v}`).join(";")}">Search any subreddit. NSFW, trending, live suggestions.</p>`;
  container.appendChild(header);

  // ---- SEARCH BAR & SUGGESTIONS ----
  const searchWrapper = $("div", css.searchWrapper);
  const searchInput = $("input", css.input, {
    type: "text", placeholder: "Search subreddits...", value: "",
    "aria-label": "Search subreddits", autocomplete: "off", spellcheck: false
  });
  const clearBtn = $("button", {
    position: "absolute", right: "16px", background: "transparent",
    border: "none", color: "#ccc", fontSize: "18px", cursor: "pointer",
    display: "none", "aria-label": "Clear search"
  }, { textContent: "×" });
  searchWrapper.append(searchInput, clearBtn);
  container.appendChild(searchWrapper);

  // Suggestions
  const suggestionBox = $("ul", css.suggestionBox); searchWrapper.appendChild(suggestionBox);
  function showSuggestions() { Object.assign(suggestionBox.style, css.suggestionBoxVisible); }
  function hideSuggestions() { Object.assign(suggestionBox.style, css.suggestionBox); suggestionBox.innerHTML = ""; }
  function renderSuggestions(suggestions) {
    suggestionBox.innerHTML = suggestions.length
      ? suggestions.map(({ name, icon, nsfw, subscribers }) =>
        `<li style="${Object.entries(css.suggestionItem).map(([k,v])=>`${k}:${v}`).join(";")};${nsfw?"background:#333;color:#fc79d6":""}">
          ${icon ? `<img src="${icon}" style="width:22px;height:22px;border-radius:50%;object-fit:cover;margin-right:7px;" />` : ""}
          <b>r/${name}</b>${nsfw ? ' <span style="font-size:12px;color:#fc79d6;font-weight:700;">NSFW</span>' : ''}
          <span style="font-size:11px;color:#aaa;margin-left:7px;">${subscribers ? subscribers.toLocaleString() + " subs" : ""}</span>
        </li>`).join("")
      : `<li style="color:#888;padding:8px 12px;">No subreddits found</li>`;
    suggestionBox.querySelectorAll("li").forEach((li, i) => {
      if (suggestions[i]) li.onclick = e => {
        e.stopPropagation();
        searchInput.value = suggestions[i].name;
        hideSuggestions();
        fetchPosts(false);
      };
      li.onmouseenter = () => li.style.background = "#222";
      li.onmouseleave = () => li.style.background = suggestions[i]?.nsfw ? "#333" : "";
    });
    showSuggestions();
  }
  async function fetchSubredditSuggestions(query) {
    if (!query) return [];
    try {
      const res = await fetch(`https://www.reddit.com/api/subreddit_autocomplete_v2.json?query=${encodeURIComponent(query)}&include_over_18=true&limit=12`);
      if (!res.ok) return [];
      const json = await res.json();
      return (json?.data?.children || []).map(c => ({
        name: c.data.display_name,
        icon: c.data.icon_img || c.data.community_icon || "",
        nsfw: !!c.data.over18,
        subscribers: c.data.subscribers || 0
      }));
    } catch { return []; }
  }
  searchInput.addEventListener("input", () => {
    clearBtn.style.display = searchInput.value ? "block" : "none";
    clearTimeout(searchInput._timer);
    const q = searchInput.value.trim();
    if (!q) return hideSuggestions();
    searchInput._timer = setTimeout(() => {
      fetchSubredditSuggestions(q).then(renderSuggestions);
    }, 120);
  });
  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim()) fetchSubredditSuggestions(searchInput.value.trim()).then(renderSuggestions);
  });
  searchInput.addEventListener("blur", () => setTimeout(hideSuggestions, 120));
  clearBtn.onclick = () => { searchInput.value = ""; clearBtn.style.display = "none"; hideSuggestions(); searchInput.focus(); };
  document.addEventListener("click", e => { if (!searchWrapper.contains(e.target)) hideSuggestions(); });
  searchWrapper.addEventListener("click", e => { e.stopPropagation(); searchInput.focus(); });
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { hideSuggestions(); fetchPosts(false); }
  });

  // ---- SORT BAR + TIME RANGE ----
  let currentSort = "top";
  let currentTimeRange = "day";
  const sortBar = $("div", css.sortBar);
  ["top", "best", "hot", "new", "controversial"].forEach(option => {
    const btn = $("button", css.sortButton(option === currentSort), { textContent: option.toUpperCase(), tabIndex: 0, "aria-label": option });
    btn.onclick = () => {
      currentSort = option; updateSortButtons(); updateTimeDropdownVisibility(); fetchPosts(false);
    };
    btn.onmouseenter = () => (btn.style.transform = "scale(1.13)");
    btn.onmouseleave = () => (btn.style.transform = css.sortButton(option === currentSort).transform);
    sortBar.appendChild(btn);
  });
  function updateSortButtons() {
    Array.from(sortBar.children).forEach((b, i) => {
      const sortOpts = ["top", "best", "hot", "new", "controversial"];
      b.style.background = sortOpts[i] === currentSort ? "var(--accent)" : "#222";
      b.style.color = sortOpts[i] === currentSort ? "#111" : "#fff";
    });
  }
  container.appendChild(sortBar);

  // Time dropdown (shows only if needed)
  const timeDropdownWrapper = $("div", { display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "7px", gap: "10px" });
  const timeDropdown = document.createElement("select");
  Object.assign(timeDropdown.style, { padding: "7px 13px", borderRadius: "7px", fontSize: "14px", border: "1px solid #bbb" });
  [
    { value: "day", label: "Today" },
    { value: "week", label: "This week" },
    { value: "month", label: "This month" },
    { value: "year", label: "This year" },
    { value: "all", label: "All time" }
  ].forEach(tr => {
    const opt = document.createElement("option");
    opt.value = tr.value; opt.innerText = tr.label;
    timeDropdown.appendChild(opt);
  });
  timeDropdown.value = currentTimeRange;
  timeDropdown.onchange = () => { currentTimeRange = timeDropdown.value; fetchPosts(false); };
  timeDropdownWrapper.appendChild(timeDropdown);
  container.appendChild(timeDropdownWrapper);
  function updateTimeDropdownVisibility() {
    if (["top", "controversial"].includes(currentSort)) timeDropdownWrapper.style.display = "flex";
    else timeDropdownWrapper.style.display = "none";
  }
  updateSortButtons(); updateTimeDropdownVisibility();

  // ---- POST GRID ----
  const postGrid = $("div", css.postGrid, { tabIndex: 0, "aria-label": "Reddit posts grid" });
  container.appendChild(postGrid);

  // ---- LOAD MORE ----
  const loadMoreBtn = $("button", css.loadMore, { textContent: "Load More", "aria-label": "Load more posts" });
  container.appendChild(loadMoreBtn);

  // ---- SKELETONS ----
  function renderSkeletons(n = 8) {
    postGrid.innerHTML = "";
    for (let i = 0; i < n; ++i) postGrid.append($("div", css.skeleton));
  }

  // ---- CREATE POST CARD ----
  function createPostCard(post, idx) {
    const card = $("div", css.postCard, { tabIndex: 0, "aria-label": post.title, role: "button" });
    let media, playPauseOverlay, isPaused = false, retryCount = 0;
    const nsfw = post.over_18 || post.nsfw;
    function showMedia() {
      if (post.isVideo && post.videoUrl) {
        media = $("video", css.postImage, { src: post.videoUrl, autoplay: !!settings.autoplay, muted: true, loop: true, playsInline: true, preload: "auto", tabIndex: -1 });
        if (!settings.autoplay) media.pause();
        media.onerror = () => showError();
      } else if (post.thumb) {
        media = $("img", css.postImage, { src: post.thumb, alt: post.title, loading: "lazy", tabIndex: -1 });
        media.onerror = () => showError();
      } else if (post.preview) {
        media = $("img", css.postImage, { src: post.preview, alt: post.title, loading: "lazy", tabIndex: -1 });
        media.onerror = () => showError();
      } else { showError(); return; }
      if (nsfw && settings.nsfwBlur) Object.assign(media.style, css.nsfwBlur);
      card.appendChild(media);
    }
    function showError() {
      card.innerHTML = "";
      const error = $("div", css.errorMedia, { innerText: "Failed to load media." });
      const retry = $("button", css.retryBtn, { innerText: "Retry" });
      retry.onclick = e => { e.stopPropagation(); if (retryCount++ < 2) { card.innerHTML = ""; showMedia(); } };
      error.appendChild(retry); card.appendChild(error);
    }
    showMedia();
    const overlay = $("div", css.postOverlay, { textContent: post.title });
    card.appendChild(overlay);
    // Send to Workflow
    const sendBtn = $("button", {
      position: "absolute", bottom: "14px", right: "14px", background: "var(--accent)",
      color: "#000", border: "none", borderRadius: "7px", fontWeight: "700", fontSize: "13px",
      padding: "6px 16px", opacity: "0", pointerEvents: "none", transition: "opacity 0.18s",
      cursor: "pointer", zIndex: 11, boxShadow: "0 2px 7px rgba(255,69,0,0.11)"
    }, {
      innerText: post.isVideo ? "Send Video to Workflow" : "Send Image to Workflow",
      tabIndex: -1,
      title: post.isVideo ? "Send video URL to ComfyUI workflow" : "Send image URL to ComfyUI workflow",
      onclick: e => { e.stopPropagation(); sendToWorkflow(post.isVideo ? post.videoUrl : (post.preview || post.thumb), post.isVideo); }
    });
    card.appendChild(sendBtn);
    card.onmouseenter = () => { Object.assign(card.style, css.postCardHover); Object.assign(overlay.style, css.postCardHoverOverlay); if (media && media.style) media.style.transform = "scale(1.07)"; sendBtn.style.opacity = "1"; sendBtn.style.pointerEvents = "auto"; };
    card.onmouseleave = () => { Object.assign(card.style, css.postCard); Object.assign(overlay.style, css.postOverlay); if (media && media.style) media.style.transform = "scale(1)"; sendBtn.style.opacity = "0"; sendBtn.style.pointerEvents = "none"; };
    card.onclick = () => showModal(idx);
    card.onkeydown = e => { if (e.key === "Enter" || e.key === " ") showModal(idx); };
    return card;
  }

  // ---- MODAL (media preview + reddit link) ----
  function showModal(idx) {
    const post = posts[idx];
    const modalBg = $("div", css.modalBigBg, { tabIndex: 0 });
    const modal = $("div", css.modalBig);
    const close = $("button", css.modalClose, { textContent: "×", "aria-label": "Close modal" });
    close.onclick = () => closeModal();
    let media;
    if (post.isVideo && post.videoUrl) {
      media = $("video", css.modalMedia, { src: post.videoUrl, autoplay: !!settings.autoplay, muted: true, loop: true, controls: true });
    } else {
      media = $("img", css.modalMedia, { src: post.preview || post.thumb, alt: post.title });
    }
    modal.appendChild(media);

    // Send to Workflow
    const sendBtn = $("button", {
      background: "var(--accent)", color: "#000", border: "none", borderRadius: "9px",
      fontWeight: "700", fontSize: "15px", padding: "10px 26px", margin: "16px 0 4px 0",
      cursor: "pointer", alignSelf: "center"
    }, {
      innerText: post.isVideo ? "Send Video to Workflow" : "Send Image to Workflow",
      title: post.isVideo ? "Send video URL to ComfyUI workflow" : "Send image URL to ComfyUI workflow",
      onclick: e => { e.stopPropagation(); sendToWorkflow(post.isVideo ? post.videoUrl : (post.preview || post.thumb), post.isVideo); }
    });
    modal.appendChild(sendBtn);

    // Reddit link
    const redditBtn = $("a", {
      display: "inline-block",
      margin: "0 10px 0 0",
      padding: "8px 22px",
      fontSize: "15px",
      fontWeight: "bold",
      color: "#fff",
      background: "#ff4500",
      borderRadius: "7px",
      textDecoration: "none",
      textAlign: "center"
    }, {
      innerText: "Open Reddit Post",
      href: `https://reddit.com${post.permalink}`,
      target: "_blank",
      rel: "noopener noreferrer"
    });
    modal.appendChild(redditBtn);

    // Meta, close, nav...
    const meta = $("div", css.modalMeta);
    meta.innerHTML = `<div style="font-size:16px; font-weight:700; margin-bottom:6px">${post.title}</div>
      <div style="font-size:13px; margin-bottom:4px"><span style="color:var(--accent);">r/${post.subreddit}</span>&nbsp;•&nbsp;<span style="color:var(--muted)">by u/${post.author}</span></div>
      <div style="display:flex; gap:18px; align-items:center;"><span style="color:var(--muted)">⬆️ ${post.ups}</span><span style="color:var(--muted)">💬 ${post.num_comments}</span></div>`;
    modal.appendChild(meta); modal.appendChild(close);
    modalBg.appendChild(modal); document.body.appendChild(modalBg);
    setTimeout(() => { Object.assign(modalBg.style, css.modalBgVisible); Object.assign(modal.style, css.modalVisible); }, 10);
    function closeModal() { Object.assign(modalBg.style, css.modalBigBg); Object.assign(modal.style, css.modalBig); setTimeout(() => modalBg.remove(), 300); document.removeEventListener("keydown", navKeys); }
    function navKeys(e) { if (e.key === "Escape") closeModal(); if (e.key === "ArrowRight" && idx < posts.length - 1) { closeModal(); showModal(idx + 1); } if (e.key === "ArrowLeft" && idx > 0) { closeModal(); showModal(idx - 1); } }
    document.addEventListener("keydown", navKeys);
    modalBg.onclick = e => { if (e.target === modalBg) closeModal(); };
    modal.onkeydown = e => navKeys(e);
  }

  // ---- TOAST ----
  function showToast(msg, type = "info") {
    let toast = document.createElement("div");
    toast.innerText = msg;
    Object.assign(toast.style, {
      position: "fixed", left: "50%", bottom: "36px", transform: "translateX(-50%)",
      background: type === "error" ? "#e05656" : "#23272e", color: "#fff",
      fontWeight: 700, fontSize: "15px", borderRadius: "12px", boxShadow: "0 2px 18px rgba(0,0,0,0.26)",
      padding: "15px 30px", zIndex: 99999, opacity: 0, transition: "opacity 0.3s", pointerEvents: "none"
    });
    document.body.appendChild(toast);
    setTimeout(() => (toast.style.opacity = "1"), 25);
    setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 350); }, 2500);
  }

  // ---- FETCH POSTS ----
  async function fetchPosts(loadMore = false) {
    if (loading) return;
    loading = true;
    loadMoreBtn.style.display = "none";
    if (!loadMore) {
      postGrid.style.gridTemplateColumns = `repeat(${settings.cardsPerRow}, 1fr)`;
      renderSkeletons(8);
    }
    const subreddit = searchInput.value.trim();
    if (!subreddit) { postGrid.innerHTML = "<div style='color:#888;padding:22px 0;font-size:18px;text-align:center;'>Type a subreddit above…</div>"; loading = false; return; }
    const bannedSubs = ["meth", "darknet", "watchpeopledie", "the_donald"];
    if (bannedSubs.includes(subreddit.toLowerCase())) {
      showToast("❌ This subreddit is banned or restricted.", "error");
      loading = false;
      renderPosts([], false); return;
    }
    const afterParam = loadMore && after ? `&after=${after}` : "";
    const tParam = ["top", "controversial"].includes(currentSort) ? `&t=${currentTimeRange}` : "";
    try {
      const corsProxy = "https://corsproxy.io/?";
      const apiUrl = `https://www.reddit.com/r/${subreddit}/${currentSort}.json?limit=24${afterParam}${tParam}`;
      const url = corsProxy + encodeURIComponent(apiUrl);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Reddit API returned " + res.status);
      const json = await res.json();
      if (!json.data || !Array.isArray(json.data.children)) {
        showToast("❌ Subreddit not found or restricted.", "error");
        renderPosts([], false); loading = false; return;
      }
      const newPosts = json.data.children.map((p) => {
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
          nsfw: d.over_18,
          subreddit: d.subreddit,
          author: d.author,
          ups: d.ups,
          num_comments: d.num_comments,
          permalink: d.permalink
        };
      });
      renderPosts(newPosts, loadMore);
      after = json.data.after;
      if (after) loadMoreBtn.style.display = "block";
    } catch (err) {
      showToast("❌ Failed to fetch posts.", "error");
      renderPosts([], false); after = null;
      console.error(err);
    } finally { loading = false; }
  }
  function renderPosts(newPosts, loadMore) {
    if (!loadMore) { posts = newPosts; postGrid.innerHTML = ""; }
    else { posts.push(...newPosts); }
    postGrid.style.gridTemplateColumns = `repeat(${settings.cardsPerRow}, 1fr)`;
    newPosts.forEach((post, i) => postGrid.appendChild(createPostCard(post, posts.indexOf(post))));
  }

  // ---- LOAD MORE ----
  loadMoreBtn.onclick = () => fetchPosts(true);

  // ---- INITIAL STATE ----
  postGrid.innerHTML = "<div style='color:#888;padding:22px 0;font-size:18px;text-align:center;'>Type a subreddit above…</div>";
}

// ---- Export for modal/floating UI use
export function renderWettitUI(containerDiv) { renderSidebar(containerDiv); }
