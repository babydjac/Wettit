import os
import numpy as np
import folder_paths
import cv2

# Dynamically resolve ComfyUI root and always use the input folder
COMFY_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
WETTIT_MEDIA_DIR = os.path.join(COMFY_ROOT, "input")

def list_video_files():
    if not os.path.exists(WETTIT_MEDIA_DIR):
        print(f"[WettitLoadVideo] WARNING: Media dir not found: {WETTIT_MEDIA_DIR}")
        return []
    files = [f for f in os.listdir(WETTIT_MEDIA_DIR)
             if f.lower().endswith(('.mp4', '.webm', '.mov', '.mkv', '.avi', '.gif')) and os.path.isfile(os.path.join(WETTIT_MEDIA_DIR, f))]
    print(f"[WettitLoadVideo] Found videos: {files}")
    return sorted(files)

class WettitLoadVideo:
    @classmethod
    def INPUT_TYPES(cls):
        videos = list_video_files()
        return {
            "required": {
                "video": (videos, {"image_upload": True, "forceInput": True}),
                "frame": ("INT", {"default": 0, "min": 0, "max": 999999, "step": 1}),
            }
        }

    RETURN_TYPES = ("IMAGE", "INT", "STRING")
    RETURN_NAMES = ("frame_image", "total_frames", "video_filename")
    FUNCTION = "load_video"
    CATEGORY = "Wettit"

    def load_video(self, video, frame=0):
        video_path = os.path.join(WETTIT_MEDIA_DIR, video)
        if not os.path.isfile(video_path):
            raise FileNotFoundError(f"[WettitLoadVideo] File not found: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise RuntimeError(f"[WettitLoadVideo] Could not open video: {video_path}")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        frame_idx = min(max(frame, 0), total_frames - 1)

        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, img = cap.read()
        if not ret:
            cap.release()
            raise RuntimeError(f"[WettitLoadVideo] Failed to read frame {frame_idx} of {video}")

        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img_np = img.astype(np.float32) / 255.0  # normalized
        cap.release()
        return (img_np, total_frames, video)

NODE_CLASS_MAPPINGS = {
    "WettitLoadVideo": WettitLoadVideo
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "WettitLoadVideo": "Wettit Load Video"
}
