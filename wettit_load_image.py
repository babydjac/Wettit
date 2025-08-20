import os
import numpy as np
import torch
from PIL import Image, ImageOps

class WettitLoadImage:
    @classmethod
    def INPUT_TYPES(cls):
        # Always use root /input folder, not custom_nodes/input
        input_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "input"))
        print(f"[WettitLoadImage] Scanning for images in: {input_dir}")

        if os.path.isdir(input_dir):
            files = [f for f in os.listdir(input_dir) if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))]
        else:
            files = []
            print(f"[WettitLoadImage ERROR] Input directory does not exist: {input_dir}")

        print(f"[WettitLoadImage DEBUG] Found files: {files}")

        return {
            "required": {
                "image": (sorted(files), {"image_upload": True, "preview": True, "label": "IMAGE"}),
                "max_size": ("INT", {"default": 768, "min": 0, "max": 8192, "step": 8, "label": "MAX SIZE"}),
                "resampling": (["lanczos", "nearest", "bilinear", "bicubic"], {"label": "UPSCALE METHOD"}),
                "upscale": (["false", "true"], {"label": "UPSCALE"}),
            },
            "optional": {
                "vae": ("VAE", {"label": "VAE"})
            }
        }

    RETURN_TYPES = ("IMAGE", "MASK", "INT", "INT", "FLOAT", "LATENT")
    RETURN_NAMES = ("image", "mask", "width", "height", "aspect", "latent")
    FUNCTION = "load_image"
    CATEGORY = "Wettit"

    def _octal_sizes(self, width, height):
        ow = width if width % 8 == 0 else width + (8 - width % 8)
        oh = height if height % 8 == 0 else height + (8 - height % 8)
        return ow, oh

    def _get_max_size(self, width, height, max_size, upscale_flag):
        aspect = width / height if height > 0 else 1.0
        if max_size is None or max_size <= 0:
            return width, height, aspect
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

    def _vae_crop_m8(self, pixels):
        H = pixels.shape[1]
        W = pixels.shape[2]
        x = (H // 8) * 8
        y = (W // 8) * 8
        if H != x or W != y:
            x_offset = (H % 8) // 2
            y_offset = (W % 8) // 2
            pixels = pixels[:, x_offset:x + x_offset, y_offset:y + y_offset, :]
        return pixels

    def load_image(self, image, max_size=768, resampling="lanczos", upscale="false", vae=None):
        input_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "input"))
        image_path = os.path.join(input_dir, image)
        print(f"[WettitLoadImage] Loading image: {image_path}")

        img = Image.open(image_path)
        try:
            img = ImageOps.exif_transpose(img)
        except Exception:
            pass
        has_alpha = 'A' in img.getbands()
        aspect = img.width / img.height if img.height else 1.0
        upscale_flag = (str(upscale).lower() == "true")

        # Compute fitted size
        new_w, new_h, aspect = self._get_max_size(img.width, img.height, int(max_size or 0), upscale_flag)
        resample_map = {
            'nearest': Image.Resampling.NEAREST,
            'bilinear': Image.Resampling.BILINEAR,
            'bicubic': Image.Resampling.BICUBIC,
            'lanczos': Image.Resampling.LANCZOS,
        }
        resample = resample_map.get(str(resampling), Image.Resampling.LANCZOS)
        if new_w != img.width or new_h != img.height:
            img_resized = img.resize((new_w, new_h), resample=resample)
        else:
            img_resized = img

        # RGB tensor
        rgb = img_resized.convert("RGB")
        img_np = (np.array(rgb).astype(np.float32) / 255.0).copy()
        img_out = torch.from_numpy(img_np).unsqueeze(0)  # [1,H,W,3]

        # Mask from alpha if any, resized with NEAREST
        if has_alpha:
            alpha = img_resized.getchannel('A') if 'A' in img_resized.getbands() else img.getchannel('A').resize((new_w, new_h), resample=Image.Resampling.NEAREST)
            mask_np = (np.array(alpha).astype(np.float32) / 255.0).copy()
        else:
            mask_np = np.ones((img_out.shape[1], img_out.shape[2]), dtype=np.float32)
        mask_out = torch.from_numpy(mask_np).unsqueeze(0)

        # Optional VAE encoding to latent
        latent = None
        try:
            if vae is not None:
                pixels = self._vae_crop_m8(img_out)
                t = vae.encode(pixels[:, :, :, :3])
                latent = {"samples": t}
        except Exception as e:
            print(f"[WettitLoadImage] VAE encode failed: {e}")
            latent = None

        return (img_out, mask_out, new_w, new_h, float(aspect), latent)

NODE_CLASS_MAPPINGS = {
    "WettitLoadImage": WettitLoadImage
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "WettitLoadImage": "Wettit Load Image"
}
