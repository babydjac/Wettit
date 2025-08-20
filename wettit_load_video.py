import os
import numpy as np
import torch
import folder_paths
import cv2
from PIL import Image

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
                # Display labels are uppercase for a bold look
                "video": (videos, {"video_upload": True, "preview": True, "label": "VIDEO"}),
                "frame": ("INT", {"default": 0, "min": 0, "max": 999999, "step": 1, "label": "FRAME", "tooltip": "Index within the sampled sequence (0-based)"}),
                "fps": ("INT", {"default": 12, "min": 1, "max": 240, "step": 1, "display": "slider", "label": "FPS", "tooltip": "Extraction frames per second"}),
                "max_size": ("INT", {"default": 768, "min": 0, "max": 8192, "step": 8, "display": "number", "label": "MAX SIZE", "tooltip": "Resize longer edge to this many pixels (0 = no resize)"}),
                "resampling": (["lanczos", "nearest", "bilinear", "bicubic"], {"label": "UPSCALE METHOD"}),
                "upscale": (["false", "true"], {"label": "UPSCALE"}),
                "skip_frames": ("INT", {"default": 0, "min": 0, "max": 300, "step": 1, "display": "slider", "label": "SKIP FRAMES", "tooltip": "Skip this many frames between kept frames"}),
                "max_frames": ("INT", {"default": 0, "min": 0, "max": 100000, "step": 1, "label": "MAX FRAMES", "tooltip": "Limit number of frames extracted (0 = no limit)"}),
            },
            "optional": {
                "vae": ("VAE", {"label": "VAE", "tooltip": "Encode frames to latent with this VAE"})
            }
        }

    RETURN_TYPES = ("IMAGE", "IMAGE", "INT", "STRING", "LATENT", "INT", "INT")
    RETURN_NAMES = ("first frame", "frames", "frame count", "video name", "latent", "fps", "fpsx2")
    FUNCTION = "load_video"
    CATEGORY = "Wettit"

    def _octal_sizes(self, width, height):
        ow = width if width % 8 == 0 else width + (8 - width % 8)
        oh = height if height % 8 == 0 else height + (8 - height % 8)
        return ow, oh

    def _get_max_size(self, width, height, max_size, upscale_flag):
        # ported from comfyui-fitsize
        aspect = width / height if height > 0 else 1.0
        fit_w = max_size
        fit_h = max_size
        if not upscale_flag and width <= max_size and height <= max_size:
            return width, height, aspect
        if aspect > 1:
            fit_h = int(max_size / aspect)
        else:
            fit_w = int(max_size * aspect)
        new_w, new_h = self._octal_sizes(fit_w, fit_h)
        return new_w, new_h, aspect

    def _resize_keep_aspect_pil(self, img_np, max_size, resampling, upscale_flag):
        if max_size is None or max_size <= 0:
            return img_np
        h, w = img_np.shape[:2]
        new_w, new_h, _ = self._get_max_size(w, h, max_size, upscale_flag)
        if new_w == w and new_h == h:
            return img_np
        pil = Image.fromarray(img_np)
        resample_map = {
            'nearest': Image.Resampling.NEAREST,
            'bilinear': Image.Resampling.BILINEAR,
            'bicubic': Image.Resampling.BICUBIC,
            'lanczos': Image.Resampling.LANCZOS,
        }
        resample = resample_map.get(resampling, Image.Resampling.LANCZOS)
        resized = pil.resize((new_w, new_h), resample=resample)
        return np.array(resized)

    def _vae_crop_m8(self, pixels):
        # pixels: [B,H,W,C]
        H = pixels.shape[1]
        W = pixels.shape[2]
        x = (H // 8) * 8
        y = (W // 8) * 8
        if H != x or W != y:
            x_offset = (H % 8) // 2
            y_offset = (W % 8) // 2
            pixels = pixels[:, x_offset:x + x_offset, y_offset:y + y_offset, :]
        return pixels

    def load_video(self, video, frame=0, fps=12, max_size=768, resampling="lanczos", upscale="false", skip_frames=0, max_frames=0, vae=None):
        video_path = os.path.join(WETTIT_MEDIA_DIR, video)
        if not os.path.isfile(video_path):
            raise FileNotFoundError(f"[WettitLoadVideo] File not found: {video_path}")

        # Open capture
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise RuntimeError(f"[WettitLoadVideo] Could not open video: {video_path}")

        orig_total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        orig_fps = cap.get(cv2.CAP_PROP_FPS)
        if orig_fps is None or orig_fps <= 0:
            orig_fps = 30.0

        upscale_flag = (str(upscale).lower() == "true")

        # Extract frames at requested fps with skipping
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        want_fps = float(max(1, int(fps)))
        sample_all = want_fps >= orig_fps - 1e-3
        frames = []
        keep_stride = max(1, int(skip_frames) + 1)
        kept_since = 0
        if sample_all:
            # Keep every frame
            t = 0.0
            while True:
                ret, f = cap.read()
                if not ret:
                    break
                f = cv2.cvtColor(f, cv2.COLOR_BGR2RGB)
                f = self._resize_keep_aspect_pil(f, int(max_size or 0), str(resampling), upscale_flag)
                if kept_since % keep_stride == 0:
                    f_np = (f.astype(np.float32) / 255.0).copy()
                    frames.append(f_np)
                    if int(max_frames or 0) > 0 and len(frames) >= int(max_frames):
                        break
                kept_since += 1
                t += 1.0 / orig_fps
        else:
            # Time-based sampling
            t = 0.0
            dt = 1.0 / orig_fps
            next_ts = 0.0
            while True:
                ret, f = cap.read()
                if not ret:
                    break
                if t + 1e-6 >= next_ts:
                    f = cv2.cvtColor(f, cv2.COLOR_BGR2RGB)
                    f = self._resize_keep_aspect_pil(f, int(max_size or 0), str(resampling), upscale_flag)
                    if kept_since % keep_stride == 0:
                        f_np = (f.astype(np.float32) / 255.0).copy()
                        frames.append(f_np)
                        if int(max_frames or 0) > 0 and len(frames) >= int(max_frames):
                            break
                    kept_since += 1
                    next_ts += 1.0 / want_fps
                t += dt

        cap.release()

        # Selected frame comes from the sampled sequence
        if not frames:
            # fallback to selected frame only
            # do a single read to build one frame
            cap2 = cv2.VideoCapture(video_path)
            ok, im0 = cap2.read()
            cap2.release()
            if not ok:
                raise RuntimeError(f"[WettitLoadVideo] Failed to read from {video}")
            im0 = cv2.cvtColor(im0, cv2.COLOR_BGR2RGB)
            im0 = self._resize_keep_aspect_pil(im0, int(max_size or 0), str(resampling), upscale_flag)
            f_np = (im0.astype(np.float32) / 255.0).copy()
            all_out = torch.from_numpy(f_np).unsqueeze(0)
            sel_out = all_out.clone()
            total_frames = orig_total
        else:
            # stack frames into a batch tensor
            try:
                stack_np = np.stack(frames, axis=0)
            except Exception as e:
                raise RuntimeError(f"[WettitLoadVideo] Failed stacking frames, inconsistent sizes: {e}")
            all_out = torch.from_numpy(stack_np)  # [N,H,W,3]
            total_frames = orig_total
            # select the requested index within sampled frames
            sidx = min(max(int(frame or 0), 0), all_out.shape[0] - 1)
            sel_out = all_out[sidx:sidx+1, ...]

        # Optional VAE encoding to latent
        latent = None
        try:
            if vae is not None:
                # Ensure multiples of 8 and only 3 channels
                pixels = self._vae_crop_m8(all_out)
                t = vae.encode(pixels[:, :, :, :3])
                latent = {"samples": t}
        except Exception as e:
            print(f"[WettitLoadVideo] VAE encode failed: {e}")
            latent = None

        return (sel_out, all_out, total_frames, video, latent, int(want_fps), int(want_fps) * 2)

NODE_CLASS_MAPPINGS = {
    "WettitLoadVideo": WettitLoadVideo
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "WettitLoadVideo": "Wettit Load Video"
}
