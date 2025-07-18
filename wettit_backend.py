import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from urllib.parse import urlparse
from uuid import uuid4

# Create Flask app and enable CORS
app = Flask(__name__)
CORS(app)

# Expose NODE_CLASS_MAPPINGS for ComfyUI compatibility
NODE_CLASS_MAPPINGS = {}

# Path to ComfyUI input folder (absolute path, update if needed)
COMFY_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
INPUT_FOLDER = os.path.join(COMFY_ROOT, "input")

@app.route('/upload_reddit_media', methods=['POST'])
def upload_reddit_media():
    try:
        print(f"\n[RedditBrowser] ========== NEW REQUEST ==========")
        data = request.get_json()
        print(f"[RedditBrowser] Incoming JSON: {data}")

        url = data.get("url")
        media_type = data.get("type")  # 'image' or 'video'

        if not url or media_type not in ["image", "video"]:
            print("[RedditBrowser] Invalid request: missing URL or type")
            return jsonify({"error": "Invalid request"}), 400

        # Determine file extension
        parsed_url = urlparse(url)
        ext = os.path.splitext(parsed_url.path)[1]
        if not ext or len(ext) > 6 or any(c in ext for c in "/\\"):
            ext = ".mp4" if media_type == "video" else ".jpg"

        # Generate unique filename
        filename = f"reddit_{uuid4().hex[:10]}{ext}"
        filepath = os.path.join(INPUT_FOLDER, filename)

        print(f"[RedditBrowser] Downloading {media_type} from: {url}")
        print(f"[RedditBrowser] Will save as: {filepath}")

        # Spoof browser User-Agent to defeat Reddit/Imgur hotlinking protections
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }

        resp = requests.get(url, stream=True, timeout=20, headers=headers)
        resp.raise_for_status()
        with open(filepath, "wb") as f:
            for chunk in resp.iter_content(1024 * 8):
                f.write(chunk)

        print(f"[RedditBrowser] SAVED: {filepath}")
        print(f"[RedditBrowser] Current input dir: {os.listdir(INPUT_FOLDER)}")

        return jsonify({
            "status": "success",
            "filename": filename,
            "message": f"{media_type.capitalize()} saved to input folder."
        }), 200

    except Exception as e:
        print("[RedditBrowser] ERROR during download/save:")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print(f"[RedditBrowser] Backend server started. Input dir: {INPUT_FOLDER}")
    app.run(host="127.0.0.1", port=8181)
