// reddit_ui.js
import { css } from "./style.js";
import { settings, saveSetting, applyTheme, applyFont, getThemeNames, getFontNames } from "./settings.js";
import { sendToWorkflow } from "./send_to_workflow.js";
import { getPinnedSubs, pinSub, unpinSub } from "./subreddits.js";

// Tiny DOM util
const $ = (tag, style = {}, props = {}) => {
  const el = document.createElement(tag);
  Object.assign(el.style, style);
  Object.assign(el, props);
  return el;
};

export function renderSidebar(el) {
  let after = null, loading = false, posts = [];
  let activeTab = "Explore"; // Explore | Favorites | History
  const container = $("div", css.container); el.appendChild(container);

  // ---- THEME & SETTINGS ----
  const themeBtn = $("button", css.themeToggle, { title: "Cycle theme", innerHTML: "🎨" });
  themeBtn.onclick = () => {
    const themes = getThemeNames();
    const idx = Math.max(0, themes.indexOf(settings.theme));
    const next = themes[(idx + 1) % themes.length];
    saveSetting("theme", next); applyTheme(next);
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
        getThemeNames().forEach(v => {
          const opt = document.createElement("option");
          opt.value = v; opt.innerText = v.charAt(0).toUpperCase() + v.slice(1);
          if (settings.theme === v) opt.selected = true;
          select.appendChild(opt);
        });
        select.onchange = () => {
          saveSetting("theme", select.value);
          applyTheme(select.value);
          fetchPosts(false);
        };
        return select;
      })()
    );
    modal.appendChild(rowTheme);

    // Font
    const rowFont = $("div", css.modalRow);
    rowFont.append(
      $("span", css.modalLabel, { innerText: "Font" }),
      (() => {
        const select = document.createElement("select");
        select.style.padding = "4px 8px";
        select.style.fontSize = "14px";
        getFontNames().forEach(v => {
          const opt = document.createElement("option");
          opt.value = v; opt.innerText = v.charAt(0).toUpperCase() + v.slice(1);
          if (settings.font === v) opt.selected = true;
          select.appendChild(opt);
        });
        select.onchange = () => { saveSetting("font", select.value); applyFont(select.value); };
        return select;
      })()
    );
    modal.appendChild(rowFont);

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

    // NSFW Only
    const rowNSFWOnly = $("div", css.modalRow);
    rowNSFWOnly.append(
      $("span", css.modalLabel, { innerText: "Show NSFW Only" }),
      (() => {
        const chk = document.createElement("input");
        chk.type = "checkbox";
        chk.checked = !!settings.nsfwOnly;
        chk.onchange = () => { saveSetting("nsfw-only", chk.checked); fetchPosts(false); };
        return chk;
      })()
    );
    modal.appendChild(rowNSFWOnly);

    // Media Type
    const rowMedia = $("div", css.modalRow);
    rowMedia.append(
      $("span", css.modalLabel, { innerText: "Media Type" }),
      (() => {
        const select = document.createElement("select");
        [
          {value:"all", label:"All"},
          {value:"images", label:"Images"},
          {value:"videos", label:"Videos"}
        ].forEach(o=>{
          const opt = document.createElement("option"); opt.value=o.value; opt.innerText=o.label;
          if (settings.mediaType===o.value) opt.selected=true; select.appendChild(opt);
        });
        select.onchange = () => { saveSetting("media-type", select.value); fetchPosts(false); };
        return select;
      })()
    );
    modal.appendChild(rowMedia);

    // Min upvotes
    const rowUp = $("div", css.modalRow);
    rowUp.append(
      $("span", css.modalLabel, { innerText: "Min Upvotes" }),
      (() => {
        const input = document.createElement("input");
        input.type = "number"; input.min = 0; input.step = 1; input.value = settings.minUpvotes || 0;
        input.onchange = () => { saveSetting("min-upvotes", Math.max(0, +input.value||0)); fetchPosts(false); };
        input.style.width = "120px";
        input.style.padding = "6px 8px";
        return input;
      })()
    );
    modal.appendChild(rowUp);

    // Removed old Cards per Row in favor of responsive columns

    // Close
    const closeBtn = $("button", css.modalClose, { innerText: "×" });
    closeBtn.onclick = () => { modalBg.remove(); modalBg = null; };
    modal.appendChild(closeBtn);
    modalBg.appendChild(modal); document.body.appendChild(modalBg);
    setTimeout(() => { Object.assign(modalBg.style, css.modalBgVisible); }, 10);
    modalBg.onclick = e => { if (e.target === modalBg) { modalBg.remove(); modalBg = null; } };
  }
  settingsBtn.onclick = showSettingsModal;

  // ---- TABS ----
  const tabs = $("div", { display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" });
  ["Explore", "Favorites", "History", "Saved"].forEach(name => {
    const btn = $("button", {
      padding: "10px 16px",
      borderRadius: "12px",
      border: "none",
      cursor: "pointer",
      fontWeight: 800,
      background: name === activeTab ? "var(--accent)" : "var(--card)",
      color: name === activeTab ? "#000" : "var(--fg)"
    }, { innerText: name });
    btn.onclick = () => { activeTab = name; renderActiveTab(); };
    tabs.appendChild(btn);
  });
  container.appendChild(tabs);

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
  // Pin/unpin current subreddit
  const pinBtn = $("button", { background: "transparent", border: "none", color: "var(--accent)", fontSize: "18px", cursor: "pointer" }, { innerText: "☆", title: "Pin subreddit" });
  pinBtn.onclick = () => {
    const name = (searchInput.value || "").trim();
    if (!name) return;
    const pins = getPinnedSubs();
    if (pins.includes(name)) { unpinSub(name); pinBtn.innerText = "☆"; }
    else { pinSub(name); pinBtn.innerText = "★"; }
    renderFavoritesBar();
  };
  const clearBtn = $("button", {
    position: "absolute", right: "16px", background: "transparent",
    border: "none", color: "#ccc", fontSize: "18px", cursor: "pointer",
    display: "none", "aria-label": "Clear search"
  }, { textContent: "×" });
  searchWrapper.append(searchInput, pinBtn, clearBtn);
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

  // ---- FAVORITES BAR ----
  const favBar = $("div", css.favoritesBar);
  container.appendChild(favBar);
  function renderFavoritesBar() {
    const pins = getPinnedSubs();
    favBar.innerHTML = "";
    pins.forEach(name => {
      const chip = $("div", { display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--card)", borderRadius: "999px", padding: "6px 10px", cursor: "pointer", boxShadow: "0 2px 8px var(--card-shadow)" });
      const span = $("span", { fontWeight: 800 }, { innerText: `r/${name}` });
      const x = $("button", { background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "16px" }, { innerText: "×", title: "Unpin" });
      x.onclick = (e) => { e.stopPropagation(); unpinSub(name); renderFavoritesBar(); };
      chip.onclick = () => { searchInput.value = name; fetchPosts(false); };
      chip.append(span, x); favBar.appendChild(chip);
    });
  }
  renderFavoritesBar();

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

  // Responsive column count (auto by viewport width)
  function getColumnCount() {
    const w = window.innerWidth || document.documentElement.clientWidth;
    if (w < 600) return 2;
    if (w < 900) return 3;
    if (w < 1400) return 4;
    return 6;
  }
  function applyResponsiveColumns() { postGrid.style.columnCount = getColumnCount(); }
  applyResponsiveColumns();
  let _resizeTO;
  window.addEventListener("resize", () => { clearTimeout(_resizeTO); _resizeTO = setTimeout(applyResponsiveColumns, 150); }, { passive: true });

  // ---- LOAD MORE ----
  const loadMoreBtn = $("button", css.loadMore, { textContent: "Load More", "aria-label": "Load more posts" });
  container.appendChild(loadMoreBtn);
  // Infinite scroll: when near bottom, auto-load
  function onScroll() {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const rect = postGrid.getBoundingClientRect();
    const bottom = rect.bottom + scrollY;
    if (!loading && after && scrollY + vh > bottom - 300) {
      fetchPosts(true);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });

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
      // Aspect ratio box matches media; use padding-bottom hack to avoid layout thrash
      let aw = Math.max(1, post.aspectW || 16);
      let ah = Math.max(1, post.aspectH || 9);
      const box = $("div", { position: "relative", width: "100%", height: 0, paddingBottom: ((ah/aw)*100) + "%", background: "transparent" });

      const updatePadding = () => {
        box.style.paddingBottom = ((ah/aw)*100) + "%";
      };

      if (post.isVideo && post.videoUrl) {
        media = $("video", { ...css.postImage, position: "absolute", inset: "0", width: "100%", height: "100%" }, {
          src: post.videoUrl, autoplay: !!settings.autoplay, muted: true, loop: true, playsInline: true, preload: "auto", tabIndex: -1
        });
        if (!settings.autoplay) media.pause();
        media.onloadedmetadata = () => {
          if (media.videoWidth && media.videoHeight) { aw = media.videoWidth; ah = media.videoHeight; updatePadding(); }
        };
        media.onerror = () => showError();
      } else if (post.thumb || post.preview) {
        const src = post.thumb || post.preview;
        media = $("img", { ...css.postImage, position: "absolute", inset: "0", width: "100%", height: "100%" }, { src, alt: post.title, loading: "lazy", tabIndex: -1 });
        media.onload = () => {
          if (media.naturalWidth && media.naturalHeight) { aw = media.naturalWidth; ah = media.naturalHeight; updatePadding(); }
        };
        media.onerror = () => showError();
      } else { showError(); return; }

      if (nsfw && settings.nsfwBlur) Object.assign(media.style, css.nsfwBlur);
      box.appendChild(media);
      card.appendChild(box);
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
    // Quick toolbar
    const toolbar = $("div", css.cardToolbar);
    const btnCopy = $("button", css.toolbarBtn, { innerText: "⧉", title: "Copy media URL" });
    btnCopy.onclick = e => { e.stopPropagation(); navigator.clipboard.writeText(post.isVideo ? post.videoUrl : (post.preview || post.thumb)); };
    const btnOpen = $("button", css.toolbarBtn, { innerText: "🔗", title: "Open media" });
    btnOpen.onclick = e => { e.stopPropagation(); window.open(post.isVideo ? post.videoUrl : (post.preview || post.thumb), "_blank"); };
    const btnSave = $("button", css.toolbarBtn, { innerText: isSaved(post) ? "★" : "☆", title: "Save/Unsave" });
    btnSave.onclick = e => { e.stopPropagation(); toggleSave(post); btnSave.innerText = isSaved(post) ? "★" : "☆"; };
    toolbar.append(btnCopy, btnOpen, btnSave);
    card.appendChild(toolbar);
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
    card.onmouseenter = () => { Object.assign(card.style, css.postCardHover); Object.assign(overlay.style, css.postCardHoverOverlay); if (media && media.style) media.style.transform = "scale(1.07)"; sendBtn.style.opacity = "1"; sendBtn.style.pointerEvents = "auto"; toolbar.style.opacity = "1"; };
    card.onmouseleave = () => { Object.assign(card.style, css.postCard); Object.assign(overlay.style, css.postOverlay); if (media && media.style) media.style.transform = "scale(1)"; sendBtn.style.opacity = "0"; sendBtn.style.pointerEvents = "none"; toolbar.style.opacity = "0"; };
    card.onclick = () => { addHistory(post); showModal(idx); };
    card.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { addHistory(post); showModal(idx); } };
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
      applyResponsiveColumns();
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
      const newPostsRaw = json.data.children.map((p) => {
        const d = p.data;
        const fb = d.media?.reddit_video?.fallback_url || d.secure_media?.reddit_video?.fallback_url || d.preview?.reddit_video_preview?.fallback_url || "";
        const prv = d.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, "&") || "";
        const thumb = d.thumbnail?.startsWith("http") ? d.thumbnail : prv;
        let videoUrl = "";
        if (fb) videoUrl = fb;
        else if (/\.(mp4|gifv|webm)$/i.test(prv)) videoUrl = prv.replace(".gifv", ".mp4");
        else videoUrl = "";
        const isVideo = !!videoUrl;
        // Aspect ratio capture
        let aspectW = 0, aspectH = 0;
        if (isVideo && (d.media?.reddit_video || d.secure_media?.reddit_video)) {
          const rv = d.media?.reddit_video || d.secure_media?.reddit_video;
          aspectW = rv?.width || 0; aspectH = rv?.height || 0;
        }
        if ((!aspectW || !aspectH) && d.preview?.images?.[0]?.source) {
          aspectW = d.preview.images[0].source.width || aspectW;
          aspectH = d.preview.images[0].source.height || aspectH;
        }
        if (!aspectW || !aspectH) { aspectW = 16; aspectH = 9; }
        const post = {
          title: d.title,
          isVideo,
          videoUrl,
          preview: prv,
          thumb: thumb || "",
          aspectW, aspectH,
          over_18: d.over_18,
          nsfw: d.over_18,
          subreddit: d.subreddit,
          author: d.author,
          ups: d.ups,
          num_comments: d.num_comments,
          permalink: d.permalink
        };
      return post;
      });
      const newPosts = newPostsRaw.filter(p => {
        if (settings.nsfwOnly && !p.nsfw) return false;
        if (settings.mediaType === 'images' && p.isVideo) return false;
        if (settings.mediaType === 'videos' && !p.isVideo) return false;
        if ((settings.minUpvotes||0) > 0 && (p.ups||0) < settings.minUpvotes) return false;
        return true;
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
    applyResponsiveColumns();
    newPosts.forEach((post, i) => postGrid.appendChild(createPostCard(post, posts.indexOf(post))));
  }

  // ---- LOAD MORE ----
  loadMoreBtn.onclick = () => fetchPosts(true);

  function renderActiveTab() {
    // For now, Explore tab renders the search + grid; Favorites shows pinned chips only; History placeholder
    header.style.display = activeTab === "Explore" ? "block" : "none";
    searchWrapper.style.display = activeTab === "Explore" ? "flex" : "none";
    favBar.style.display = activeTab !== "History" ? "flex" : "none";
    postGrid.style.display = activeTab !== "Favorites" ? "block" : "none";
    loadMoreBtn.style.display = activeTab === "Explore" ? "block" : "none";
    if (activeTab === "History") {
      // Render history items
      const items = getHistory();
      postGrid.innerHTML = "";
      applyResponsiveColumns();
      items.forEach(item => postGrid.appendChild(createPostCard(item, posts.length + 1)));
    } else if (activeTab === "Saved") {
      const items = getSaved();
      postGrid.innerHTML = "";
      applyResponsiveColumns();
      items.forEach(item => postGrid.appendChild(createPostCard(item, posts.length + 1)));
    }
    // Recolor tabs
    Array.from(tabs.children).forEach(btn => {
      const name = btn.innerText;
      btn.style.background = name === activeTab ? "var(--accent)" : "var(--card)";
      btn.style.color = name === activeTab ? "#000" : "var(--fg)";
    });
  }
  renderActiveTab();

  // ---- HISTORY ----
  const HISTORY_KEY = "wettit-history";
  function getHistory() {
    try {
      const arr = JSON.parse(localStorage.getItem(HISTORY_KEY));
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  function addHistory(post) {
    const arr = getHistory();
    const key = post.permalink || post.preview || post.videoUrl || post.title;
    const exists = arr.find(x => (x.permalink||x.preview||x.videoUrl||x.title) === key);
    if (!exists) arr.unshift({
      title: post.title,
      isVideo: post.isVideo,
      videoUrl: post.videoUrl,
      preview: post.preview,
      thumb: post.thumb,
      subreddit: post.subreddit,
      author: post.author,
      ups: post.ups,
      num_comments: post.num_comments,
      permalink: post.permalink,
      over_18: post.over_18,
      nsfw: post.nsfw
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, 50)));
  }

  // ---- SAVED ----
  const SAVED_KEY = "wettit-saved";
  function getSaved() {
    try { const arr = JSON.parse(localStorage.getItem(SAVED_KEY)); return Array.isArray(arr) ? arr : []; } catch { return []; }
  }
  function isSaved(post) {
    const arr = getSaved(); const key = post.permalink || post.preview || post.videoUrl || post.title; return !!arr.find(x => (x.permalink||x.preview||x.videoUrl||x.title) === key);
  }
  function toggleSave(post) {
    const arr = getSaved(); const key = post.permalink || post.preview || post.videoUrl || post.title; const idx = arr.findIndex(x => (x.permalink||x.preview||x.videoUrl||x.title) === key);
    if (idx >= 0) arr.splice(idx,1); else arr.unshift(post);
    localStorage.setItem(SAVED_KEY, JSON.stringify(arr.slice(0, 200)));
  }

  // ---- INITIAL STATE ----
  postGrid.innerHTML = "<div style='color:#888;padding:22px 0;font-size:18px;text-align:center;'>Type a subreddit above…</div>";
}

// ---- Export for modal/floating UI use
export function renderWettitUI(containerDiv) { renderSidebar(containerDiv); }
