// style.js
// FULL MODERN UI STYLE OBJECTS — Reddit UI, Imgur grid, trending, favorites, mini preview, drag, flippable
// Everything you need, organized by feature and UI area.

export const css = {
  // ------------- GLOBAL LAYOUT ------------- //
  container: {
    padding: "clamp(18px, 4vw, 36px)",
    fontFamily: "var(--font, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif)",
    color: "var(--fg, #e9f4fa)",
    background: "linear-gradient(180deg, var(--bg, #16204c) 0%, var(--bg2, #102045) 100%)",
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    height: "100%",
    gap: "clamp(18px, 3vw, 36px)",
    position: "relative",
    transition: "background 0.3s, color 0.2s"
  },

  // ------------- BUTTONS (Settings, Theme) ------------- //
  settingsBtn: {
    position: "absolute",
    top: "24px",
    right: "68px",
    background: "var(--card, #203763)",
    border: "none",
    color: "var(--accent, #17e1cf)",
    fontSize: "22px",
    borderRadius: "50%",
    padding: "8px 12px",
    cursor: "pointer",
    boxShadow: "0 2px 10px var(--card-shadow, rgba(23,225,207,0.08))",
    zIndex: 12,
    marginLeft: "8px",
    transition: "background 0.19s, box-shadow 0.19s"
  },
  themeToggle: {
    position: "absolute",
    top: "22px",
    right: "26px",
    background: "var(--card, #203763)",
    border: "none",
    color: "var(--accent, #17e1cf)",
    fontSize: "20px",
    borderRadius: "50%",
    padding: "8px 12px",
    cursor: "pointer",
    boxShadow: "0 2px 10px var(--card-shadow, rgba(23,225,207,0.08))",
    zIndex: 12,
    transition: "background 0.19s, box-shadow 0.19s"
  },

  // ------------- MODALS (Settings, Media, etc.) ------------- //
  modalBg: {
    position: "fixed",
    inset: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(15, 34, 74, 0.93)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    opacity: "0",
    transition: "opacity 0.24s cubic-bezier(.36,2,.43,.96)"
  },
  modalBgVisible: { opacity: "1" },
  modal: {
    minWidth: "320px",
    maxWidth: "96vw",
    background: "var(--card, #213056)",
    borderRadius: "20px",
    boxShadow: "0 10px 40px var(--card-shadow, rgba(23,225,207,0.18))",
    color: "var(--fg, #e9f4fa)",
    padding: "36px 38px 26px 38px",
    minHeight: "1px",
    position: "relative",
    transition: "transform 0.24s, box-shadow 0.23s"
  },
  modalClose: {
    position: "absolute",
    top: "16px",
    right: "18px",
    fontSize: "29px",
    cursor: "pointer",
    background: "none",
    border: "none",
    color: "var(--muted, #98b4c5)",
    zIndex: 11,
    transition: "color 0.18s"
  },
  modalTitle: {
    fontWeight: 900,
    fontSize: "23px",
    marginBottom: "17px"
  },
  modalRow: {
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px"
  },
  modalLabel: {
    fontWeight: 700,
    fontSize: "16px"
  },

  // ------------- PINNED/FAVORITE SUBREDDITS BAR ------------- //
  favoritesBar: {
    display: "flex",
    gap: "8px",
    margin: "8px 0 8px 0",
    flexWrap: "wrap"
  },

  // ------------- TRENDING BANNER ------------- //
  trendingBar: {
    width: "100%",
    minHeight: "36px",
    padding: "7px 0 0 7px",
    background: "linear-gradient(90deg, var(--accent,#17e1cf) 6%, var(--bg2,#102045) 86%)",
    color: "#fff",
    fontWeight: 700,
    borderRadius: "14px",
    fontSize: "16px",
    margin: "2px 0 17px 0",
    overflow: "hidden",
    display: "flex",
    alignItems: "center"
  },

  // ------------- HEADER ------------- //
  header: {
    textAlign: "center",
    marginBottom: "10px"
  },
  logo: {
    fontSize: "44px",
    fontWeight: "900",
    color: "var(--accent, #17e1cf)",
    textShadow: "0 0 22px rgba(23,225,207,0.38)",
    margin: 0,
    letterSpacing: "-1px"
  },
  subtitle: {
    fontSize: "15px",
    color: "var(--muted, #98b4c5)",
    margin: "10px 0 0"
  },

  // ------------- SEARCH BAR & SUGGESTIONS ------------- //
  searchWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "var(--card, #213056)",
    borderRadius: "20px",
    padding: "8px 16px",
    boxShadow: "0 3px 9px var(--card-shadow, rgba(23,225,207,0.06))"
  },
  input: {
    flex: 1,
    padding: "15px 20px",
    border: "none",
    borderRadius: "13px",
    background: "transparent",
    color: "var(--fg, #e9f4fa)",
    fontSize: "16px",
    outline: "none",
    transition: "box-shadow 0.19s, background 0.19s"
  },
  inputFocus: {
    boxShadow: "0 0 0 3px var(--accent, #17e1cf)"
  },
  suggestionBox: {
    position: "absolute",
    top: "calc(100% + 10px)",
    left: "0",
    right: "0",
    margin: 0,
    padding: "13px 0",
    listStyle: "none",
    background: "var(--card, #213056)",
    border: "1px solid #19314d",
    borderRadius: "18px",
    maxHeight: "320px",
    overflowY: "auto",
    zIndex: 100,
    display: "none",
    boxShadow: "0 10px 32px var(--card-shadow, rgba(23,225,207,0.13))",
    opacity: "0",
    transform: "scale(0.96) translateY(-10px)",
    transition: "opacity 0.23s, transform 0.23s"
  },
  suggestionBoxVisible: {
    display: "block",
    opacity: "1",
    transform: "scale(1) translateY(0)"
  },
  suggestionItem: {
    padding: "13px 24px",
    cursor: "pointer",
    color: "var(--fg, #e9f4fa)",
    fontSize: "15px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    borderRadius: "8px",
    transition: "background 0.13s, color 0.13s"
  },
  suggestionItemHover: {
    background: "var(--accent, #17e1cf)",
    color: "#0d2738"
  },

  // ------------- SORT BAR ------------- //
  sortBar: {
    display: "flex",
    justifyContent: "center",
    gap: "18px",
    flexWrap: "wrap",
    marginBottom: "14px"
  },
  sortButton: active => ({
    padding: "13px 26px",
    fontSize: "14px",
    fontWeight: "700",
    background: active ? "var(--accent, #17e1cf)" : "var(--card, #213056)",
    color: active ? "#0d2738" : "var(--fg, #e9f4fa)",
    border: "none",
    borderRadius: "13px",
    cursor: "pointer",
    boxShadow: active ? "0 3px 15px rgba(23,225,207,0.13)" : "none",
    transition: "all 0.22s",
    outline: active ? "2px solid var(--accent, #17e1cf)" : "none"
  }),

  // ------------- POST GRID (Pinterest-style Masonry) ------------- //
  // Use CSS multi-columns to achieve masonry flow without gaps.
  postGrid: {
    display: "block",
    columnCount: 3,
    columnGap: "8px",
    WebkitColumnGap: "8px",
    width: "100%",
    maxWidth: "100%",
    margin: 0,
    padding: 0
  },
  skeleton: {
    height: "auto",
    minHeight: 0,
    background: "var(--bg2, #16204c)",
    animation: "pulse 1.3s infinite linear alternate",
    borderRadius: "18px"
  },

  // ------------- POST CARD (with Flip/Drag Styles) ------------- //
  postCard: {
    // For CSS grid we don't need breakInside
    background: "transparent",
    borderRadius: "0",
    marginBottom: "8px",
    boxShadow: "none",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.19s, box-shadow 0.21s",
    outline: "none",
    cursor: "pointer",
    position: "relative",
    breakInside: "avoid",
    pageBreakInside: "avoid",
    WebkitColumnBreakInside: "avoid"
  },
  postCardHover: {
    transform: "translateY(-8px) scale(1.03)",
    boxShadow: "0 18px 38px rgba(23,225,207,0.19)",
    zIndex: 2
  },
  // FLIPPABLE (front/back for advanced card info)
  flippable: {
    perspective: "800px"
  },
  flippableInner: {
    transition: "transform 0.46s cubic-bezier(.5,1.9,.5,.88)",
    transformStyle: "preserve-3d",
    position: "relative"
  },
  flippableFront: {
    backfaceVisibility: "hidden",
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 1
  },
  flippableBack: {
    backfaceVisibility: "hidden",
    position: "absolute",
    width: "100%",
    height: "100%",
    background: "#13182b",
    color: "#fff",
    borderRadius: "16px",
    transform: "rotateY(180deg)",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },
  dragOverHighlight: {
    boxShadow: "0 0 0 5px var(--accent, #17e1cf)",
    opacity: "0.86"
  },

  // CARD MEDIA & OVERLAY
  postImage: {
    width: "100%",
    display: "block",
    objectFit: "cover",
    background: "transparent",
    border: 0,
    outline: "none",
    transition: "transform 0.36s"
    // No fixed height/aspect for Imgur grid
  },
  nsfwBlur: {
    filter: "blur(24px)",
    pointerEvents: "none"
  },
  nsfwBadge: {
    position: "absolute",
    top: "14px",
    right: "14px",
    background: "var(--accent, #17e1cf)",
    color: "#0d2738",
    fontWeight: "900",
    borderRadius: "9px",
    fontSize: "13px",
    padding: "4px 11px",
    zIndex: 5,
    boxShadow: "0 4px 14px rgba(23,225,207,0.13)",
    letterSpacing: "1.2px"
  },
  playPauseOverlay: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    background: "rgba(23,225,207,0.42)",
    color: "#16204c",
    fontSize: "38px",
    borderRadius: "50%",
    padding: "10px 20px",
    opacity: "0.92",
    zIndex: 4,
    display: "none",
    pointerEvents: "none"
  },
  playPauseOverlayVisible: { display: "block" },
  errorMedia: {
    width: "100%",
    height: "100%",
    background: "var(--hover, #283c5b)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--muted, #a0d7da)",
    fontSize: "16px",
    padding: "18px",
    textAlign: "center"
  },
  retryBtn: {
    background: "var(--accent, #17e1cf)",
    color: "#0d2738",
    border: "none",
    borderRadius: "9px",
    padding: "9px 22px",
    fontWeight: "800",
    cursor: "pointer",
    marginLeft: "12px",
    fontSize: "15px",
    marginTop: "8px",
    transition: "background 0.18s, color 0.13s"
  },
  postOverlay: {
    position: "absolute",
    bottom: "0",
    left: "0",
    right: "0",
    padding: "16px",
    background: "linear-gradient(transparent, rgba(16,32,69,0.92))",
    color: "#e9f4fa",
    fontSize: "16px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    opacity: "0",
    transition: "opacity 0.21s"
  },
  postCardHoverOverlay: {
    opacity: "1"
  },
  cardToolbar: {
    position: "absolute",
    top: "10px",
    left: "10px",
    display: "flex",
    gap: "6px",
    opacity: "0",
    transition: "opacity 0.18s",
    zIndex: 12
  },
  toolbarBtn: {
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "4px 6px",
    cursor: "pointer",
    fontSize: "12px"
  },
  loadMore: {
    padding: "18px 38px",
    margin: "32px auto 24px",
    border: "none",
    borderRadius: "15px",
    background: "var(--accent, #17e1cf)",
    color: "#0d2738",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 3px 16px rgba(23,225,207,0.13)",
    display: "block",
    fontSize: "16px",
    transition: "background 0.17s"
  },

  // ------------- MODAL MEDIA (BIG MODALS) ------------- //
  modalBigBg: {
    position: "fixed",
    inset: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(14, 31, 67, 0.98)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    opacity: "0",
    transition: "opacity 0.31s"
  },
  modalBig: {
    maxWidth: "96vw",
    maxHeight: "90vh",
    background: "var(--bg2, #102045)",
    borderRadius: "24px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    boxShadow: "0 16px 50px var(--card-shadow, rgba(23,225,207,0.19))",
    transform: "scale(0.96)",
    transition: "transform 0.27s"
  },
  modalVisible: {
    transform: "scale(1)"
  },
  modalMedia: {
    maxWidth: "100%",
    maxHeight: "60vh",
    objectFit: "contain",
    borderRadius: "17px",
    background: "var(--card, #213056)",
    margin: "18px auto 0",
    display: "block"
  },
  modalMeta: {
    padding: "22px 30px 20px 30px",
    background: "var(--card, #213056)",
    color: "var(--fg, #e9f4fa)",
    fontSize: "16px",
    borderRadius: "0 0 22px 22px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    wordBreak: "break-word"
  },
  modalNav: {
    position: "absolute",
    top: "50%",
    fontSize: "38px",
    color: "var(--fg, #e9f4fa)",
    cursor: "pointer",
    padding: "18px",
    background: "rgba(16,32,69,0.16)",
    borderRadius: "50%",
    userSelect: "none",
    transition: "color 0.17s, transform 0.19s"
  },

  // ------------- MINI PREVIEW (Hover Post/Suggestion) ------------- //
  miniPreview: {
    position: "fixed",
    zIndex: 99999,
    pointerEvents: "none",
    background: "#191e29",
    boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
    borderRadius: "11px",
    padding: "8px",
    maxWidth: "160px",
    maxHeight: "160px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  // ------------- KEYFRAMES, EXTRAS, ETC. ------------- //
  '@keyframes pulse': {
    '0%': { opacity: 0.92 },
    '100%': { opacity: 0.5 }
  }
};
