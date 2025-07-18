// index.js
// Boss, this file registers the Wettit Reddit Browser sidebar with ComfyUI.

import { app } from "../../scripts/app.js";
import { renderSidebar } from "./reddit_ui.js";
import './wettit_modal.js';  // must define window.showWettitModal
import './wettit_fab.js';    // fab calls window.showWettitModal()

// Register Wettit Sidebar tab in ComfyUI
app.extensionManager.registerSidebarTab({
  id: "redditBrowserTab",
  icon: "pi pi-reddit",
  title: "Wettit",
  tooltip: "Explore Reddit Threads in ComfyUI",
  type: "custom",
  render: renderSidebar
});
