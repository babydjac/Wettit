import os
import subprocess
import sys
from .wettit_load_image import WettitLoadImage
from .wettit_load_video import WettitLoadVideo

NODE_CLASS_MAPPINGS = {
    "WettitLoadImage": WettitLoadImage,
    "WettitLoadVideo": WettitLoadVideo,
}

WEB_DIRECTORY = os.path.join(os.path.dirname(__file__), "js")

# Auto-start backend Flask if not already running (UNIX-only, boss mode)
def _start_backend():
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.connect(("127.0.0.1", 8181))
        sock.close()
    except Exception:
        # Not running: start it
        backend_path = os.path.join(os.path.dirname(__file__), "wettit_backend.py")
        subprocess.Popen([sys.executable, backend_path])

_start_backend()
