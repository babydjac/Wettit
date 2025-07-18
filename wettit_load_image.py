import os
import numpy as np
from PIL import Image

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
                "image": (
                    sorted(files),
                    {"image_upload": True, "preview": True}
                ),
            }
        }

    RETURN_TYPES = ("IMAGE", "MASK")
    RETURN_NAMES = ("image", "mask")
    FUNCTION = "load_image"
    CATEGORY = "Wettit"

    def load_image(self, image):
        input_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "input"))
        image_path = os.path.join(input_dir, image)
        print(f"[WettitLoadImage] Loading image: {image_path}")

        img = Image.open(image_path).convert("RGBA")
        img_np = np.array(img)[..., :3] / 255.0
        mask_np = (np.array(img)[..., 3] / 255.0) if img.mode == "RGBA" else np.ones(img_np.shape[:2], dtype=np.float32)
        img_out = img_np[None, ...]
        mask_out = mask_np[None, ..., None]
        return (img_out, mask_out)

NODE_CLASS_MAPPINGS = {
    "WettitLoadImage": WettitLoadImage
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "WettitLoadImage": "Wettit Load Image"
}
