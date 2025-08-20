// send_to_workflow.js
export async function sendToWorkflow(url, isVideo = false) {
  try {
    // 1. Upload file
    const res = await fetch("http://127.0.0.1:8181/upload_reddit_media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, type: isVideo ? "video" : "image" })
    });
    const json = await res.json();
    if (!res.ok || !json.filename) throw new Error(json.error || "Upload failed");
    const filename = json.filename;

    // 2. Find Load node
    let graph = app.graph;
    let foundNode = null;
    const nodeTypes = isVideo
      ? ["WettitLoadVideo", "LoadVideo", "Video Input"]
      : ["WettitLoadImage", "LoadImage", "Image Input"];
    for (let node of graph._nodes || graph.nodes || []) {
      if (nodeTypes.includes(node.type)) {
        foundNode = node;
        break;
      }
    }
    if (!foundNode) {
      showToast(`No ${isVideo ? "Load Video" : "Load Image"} node found!`, "error");
      return;
    }
    const prop = isVideo ? "video" : "image";
    // Set property directly
    if (foundNode.setProperty) foundNode.setProperty(prop, filename);
    if (foundNode.properties) foundNode.properties[prop] = filename;

    // Ensure widget reflects the new file and includes it in options
    const widgets = (foundNode.widgets || []);
    const w = widgets.find(
      vw => (vw && (vw.name === prop || vw.label === prop))
    );
    if (w) {
      try {
        // ensure value exists in options for combo/file widgets
        if (w.options) {
          const vals = Array.isArray(w.options.values) ? w.options.values : (Array.isArray(w.options) ? w.options : null);
          if (vals && !vals.includes(filename)) {
            vals.push(filename);
            if (Array.isArray(w.options.values)) w.options.values = vals;
            else if (Array.isArray(w.options)) w.options = vals;
          }
        }
        w.value = filename;
        if (foundNode.onWidgetChanged) foundNode.onWidgetChanged(w, filename, null, null, null);
      } catch (e) {
        console.warn("Widget update failed, falling back to property change only", e);
      }
    }

    // Notify node about property change
    if (foundNode.onPropertyChanged) foundNode.onPropertyChanged(prop, filename);

    // Nudge UI: simulate reload to refresh dropdowns in editor
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "r", code: "KeyR", keyCode: 82, bubbles: true }));

    // Refresh canvas and focus node
    if (graph.setDirtyCanvas) graph.setDirtyCanvas(true, true);
    if (graph.onNodeChanged) graph.onNodeChanged(foundNode);
    if (foundNode.pos && app.canvas) app.canvas.centerOnNode(foundNode);

    showToast(`${isVideo ? "Video" : "Image"} loaded and selected in workflow!`);

  } catch (err) {
    showToast("Failed to send to workflow", "error");
    console.error("sendToWorkflow error:", err);
  }
}

// Toast helper
function showToast(msg, type = "info") {
  let toast = document.createElement("div");
  toast.innerText = msg;
  Object.assign(toast.style, {
    position: "fixed",
    left: "50%",
    bottom: "36px",
    transform: "translateX(-50%)",
    background: type === "error" ? "#e05656" : "#23272e",
    color: "#fff",
    fontWeight: 700,
    fontSize: "15px",
    borderRadius: "12px",
    boxShadow: "0 2px 18px rgba(0,0,0,0.26)",
    padding: "15px 30px",
    zIndex: 99999,
    opacity: 0,
    transition: "opacity 0.3s",
    pointerEvents: "none"
  });
  document.body.appendChild(toast);
  setTimeout(() => (toast.style.opacity = "1"), 25);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 350);
  }, 2500);
}
