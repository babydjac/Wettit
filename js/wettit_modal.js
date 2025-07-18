// wettit_modal.js
import { renderWettitUI } from './reddit_ui.js';

window.showWettitModal = function showWettitModal() {
  // Prevent double-open
  if (document.getElementById('wettit-modal-bg')) return;

  // Create modal BG
  const bg = document.createElement('div');
  bg.id = 'wettit-modal-bg';
  Object.assign(bg.style, {
    position: 'fixed',
    left: 0,
    top: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.81)',
    zIndex: 100000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });

  // Modal window
  const modal = document.createElement('div');
  Object.assign(modal.style, {
    minWidth: '470px',
    minHeight: '560px',
    maxWidth: '98vw',
    maxHeight: '98vh',
    background: '#181818',
    color: '#fff',
    borderRadius: '21px',
    boxShadow: '0 12px 30px #000a',
    padding: '0',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  });

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  Object.assign(closeBtn.style, {
    position: 'absolute',
    top: '18px',
    right: '26px',
    fontSize: '38px',
    background: 'none',
    border: 'none',
    color: '#bbb',
    cursor: 'pointer',
    zIndex: 1,
    transition: 'color 0.17s'
  });
  closeBtn.onmouseenter = () => closeBtn.style.color = '#ff4500';
  closeBtn.onmouseleave = () => closeBtn.style.color = '#bbb';
  closeBtn.onclick = () => bg.remove();
  modal.appendChild(closeBtn);

  // Modal content area
  const uiContainer = document.createElement('div');
  Object.assign(uiContainer.style, {
    padding: '32px 24px 20px 24px',
    overflowY: 'auto',
    flex: 1
  });
  modal.appendChild(uiContainer);

  // Render the main Reddit UI inside modal
  renderWettitUI(uiContainer);

  // Append modal and bg
  bg.appendChild(modal);
  document.body.appendChild(bg);

  // ESC key to close
  function keyListener(e) {
    if (e.key === "Escape") {
      bg.remove();
      window.removeEventListener("keydown", keyListener);
    }
  }
  window.addEventListener("keydown", keyListener);

  // Click-outside closes
  bg.onclick = (e) => {
    if (e.target === bg) {
      bg.remove();
      window.removeEventListener("keydown", keyListener);
    }
  };
};
