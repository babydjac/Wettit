// wettit_fab.js
// Boss: Floating custom image button to launch the Wettit modal. No background, pure PNG.

const BUTTON_IMG = "https://iili.io/FWbsZT7.png";

export function injectWettitFAB() {
  if (window._wettitFab) return; // Prevent duplicate

  // Create button
  const fab = document.createElement("img");
  fab.src = BUTTON_IMG;
  fab.alt = "Open Wettit";
  Object.assign(fab.style, {
    position: "fixed",
    bottom: "34px",
    right: "34px",
    width: "64px",
    height: "64px",
    zIndex: 20000,
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: "0",
    boxShadow: "0 6px 30px rgba(0,0,0,0.13)",
    transition: "transform 0.13s",
    userSelect: "none",
    outline: "none",
    opacity: "0.97"
  });

  fab.onmouseenter = () => fab.style.transform = "scale(1.13)";
  fab.onmouseleave = () => fab.style.transform = "scale(1)";
  fab.onclick = () => window.showWettitModal && window.showWettitModal();

  // (Optional) Make it draggable
  let offsetX, offsetY, dragging = false;
  fab.onmousedown = (e) => {
    dragging = true;
    offsetX = e.clientX - fab.offsetLeft;
    offsetY = e.clientY - fab.offsetTop;
    fab.style.transition = "none";
    document.body.style.userSelect = "none";
  };
  document.addEventListener("mousemove", (e) => {
    if (dragging) {
      fab.style.left = (e.clientX - offsetX) + "px";
      fab.style.top = (e.clientY - offsetY) + "px";
      fab.style.bottom = fab.style.right = "auto";
    }
  });
  document.addEventListener("mouseup", () => {
    dragging = false;
    fab.style.transition = "transform 0.13s";
    document.body.style.userSelect = "";
  });

  document.body.appendChild(fab);
  window._wettitFab = fab;
}

// Auto-inject on load
injectWettitFAB();
