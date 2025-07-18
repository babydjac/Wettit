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
    const nodeTypes = isVideo ? ["LoadVideo", "Video Input"] : ["LoadImage", "Image Input"];
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
    if (foundNode.setProperty) foundNode.setProperty(prop, filename);
    else if (foundNode.properties) foundNode.properties[prop] = filename;
    if (foundNode.onPropertyChanged) foundNode.onPropertyChanged(prop, filename);

    // 3. Simulate "R" keypress to force reload
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "r", code: "KeyR", keyCode: 82, bubbles: true })
    );

    // 4. Bruteforce select dropdown after reload
    function trySelectDropdown(node, prop, filename, maxTries = 16) {
      let tries = 0;
      function attempt() {
        const dropdown = document.querySelector(
          `select[name="${prop}"], select[data-prop="${prop}"]`
        );
        if (
          dropdown &&
          [...dropdown.options].some(opt => opt.value === filename)
        ) {
          dropdown.value = filename;
          dropdown.dispatchEvent(new Event("change", { bubbles: true }));
          if (node.setProperty) node.setProperty(prop, filename);
          if (node.onPropertyChanged) node.onPropertyChanged(prop, filename);
          showToast(`${isVideo ? "Video" : "Image"} loaded and selected in workflow!`);
        } else if (++tries < maxTries) {
          setTimeout(attempt, 140);
        } else {
          showToast("File loaded, but could not select drop down automatically", "error");
        }
      }
      attempt();
    }
    trySelectDropdown(foundNode, prop, filename);

    // 5. Refresh canvas
    if (graph.setDirtyCanvas) graph.setDirtyCanvas(true, true);
    if (graph.onNodeChanged) graph.onNodeChanged(foundNode);
    if (foundNode.pos && app.canvas) app.canvas.centerOnNode(foundNode);

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
