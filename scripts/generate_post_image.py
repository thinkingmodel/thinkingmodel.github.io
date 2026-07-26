#!/usr/bin/env python3
"""
generate_post_image.py

Generates a cinematic 16:9 hero image (DALL-E 3) for a blog post and saves it
to assets/img/posts/<YYYYMMDD>/main.jpg, matching the `img:` path convention
used in _posts frontmatter.

Usage:
    python scripts/generate_post_image.py --slug 20260726 --prompt-file prompt.txt
    python scripts/generate_post_image.py --slug 20260726 --prompt "..."
    python scripts/generate_post_image.py --slug 20260726 --prompt-file p.txt --name lstm
    python scripts/generate_post_image.py --slug 20260726 --prompt-file p.txt --force

Requirements:
    pip install openai requests pillow python-dotenv
"""

import os
import sys
import io
import argparse
import requests
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from openai import OpenAI
from PIL import Image

# Windows consoles default to cp1252, which cannot encode the status emoji.
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except (AttributeError, OSError):
    pass

# ── Config ────────────────────────────────────────────
REPO_ROOT = Path(__file__).parent.parent
POSTS_IMG_DIR = REPO_ROOT / "assets" / "img" / "posts"

# dall-e-3 is no longer available on this account; the gpt-image-* family
# replaced it. These models reject dall-e-3's `style` parameter and return
# base64 rather than a URL.
MODEL_CHAIN = ["gpt-image-2", "gpt-image-1.5", "gpt-image-1"]

# Widest first. None of the gpt-image sizes is exactly 16:9, so whatever
# comes back is center-cropped to 16:9 below.
SIZE_CHAIN = ["1792x1024", "1536x1024", "auto"]

TARGET_RATIO = 16 / 9


def get_client():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("❌  OPENAI_API_KEY not set.")
        print("    Run:  export OPENAI_API_KEY='sk-...'")
        print("    Or:   Create .env with  OPENAI_API_KEY=sk-...")
        sys.exit(1)
    return OpenAI(api_key=api_key)


def crop_to_ratio(img, ratio=TARGET_RATIO):
    """Center-crop to the target aspect ratio, trimming the long axis."""
    w, h = img.size
    if abs((w / h) - ratio) < 0.005:
        return img
    if w / h > ratio:            # too wide, trim sides
        new_w = int(round(h * ratio))
        left = (w - new_w) // 2
        return img.crop((left, 0, left + new_w, h))
    new_h = int(round(w / ratio))  # too tall, trim top and bottom
    top = (h - new_h) // 2
    return img.crop((0, top, w, top + new_h))


def call_api(client, prompt):
    """Try each model and size until one is accepted. Returns raw image bytes."""
    last_err = None
    for model in MODEL_CHAIN:
        for size in SIZE_CHAIN:
            try:
                print(f"      trying {model} at {size}...")
                resp = client.images.generate(
                    model=model, prompt=prompt, n=1,
                    size=size, quality="high",
                )
            except Exception as e:
                last_err = e
                msg = str(e)
                # Billing and auth failures will not improve on retry.
                if "billing" in msg.lower() or "api key" in msg.lower():
                    raise
                continue

            item = resp.data[0]
            revised = getattr(item, "revised_prompt", None)
            if revised:
                print(f"\n  ℹ️   Model revised the prompt to:\n      {revised[:300]}...\n")

            b64 = getattr(item, "b64_json", None)
            if b64:
                import base64
                return base64.b64decode(b64)
            url = getattr(item, "url", None)
            if url:
                r = requests.get(url, timeout=120)
                r.raise_for_status()
                return r.content
            last_err = RuntimeError("Response contained neither b64_json nor url")

    raise last_err or RuntimeError("No model/size combination succeeded")


def generate_image(client, prompt, out_path):
    """Generate a landscape image, crop to 16:9, convert to JPEG, save."""
    raw = call_api(client, prompt)

    img = Image.open(io.BytesIO(raw)).convert("RGB")
    img = crop_to_ratio(img)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    if out_path.suffix.lower() in (".jpg", ".jpeg"):
        img.save(out_path, "JPEG", quality=90, optimize=True)
    else:
        img.save(out_path)

    return img.size, out_path.stat().st_size


def main():
    parser = argparse.ArgumentParser(
        description="Generate a hero image for a blog post"
    )
    parser.add_argument("--slug", required=True,
                        help="Image folder name, normally the post date as YYYYMMDD")
    parser.add_argument("--name", default="main",
                        help="Output filename without extension (default: main)")
    parser.add_argument("--prompt", default=None, help="Prompt text")
    parser.add_argument("--prompt-file", default=None,
                        help="Read the prompt from a file (preferred for long prompts)")
    parser.add_argument("--force", action="store_true",
                        help="Overwrite the image if it already exists")
    args = parser.parse_args()

    if not args.prompt and not args.prompt_file:
        print("❌  Provide --prompt or --prompt-file")
        sys.exit(1)

    if args.prompt_file:
        prompt = Path(args.prompt_file).read_text(encoding="utf-8").strip()
    else:
        prompt = args.prompt.strip()

    if len(prompt) > 32000:
        print(f"❌  Prompt is {len(prompt)} chars, which is too long.")
        sys.exit(1)

    out_path = POSTS_IMG_DIR / args.slug / f"{args.name}.jpg"

    if out_path.exists() and not args.force:
        print(f"⏭️   {out_path.relative_to(REPO_ROOT)} already exists.")
        print("    Use --force to regenerate.")
        return

    print("🚀  Post Image Generator")
    print("=" * 52)
    print(f"🎯  Target: {out_path.relative_to(REPO_ROOT)}")
    print(f"📐  Size:   widest available, cropped to 16:9")
    print(f"📝  Prompt: {len(prompt)} chars")

    client = get_client()

    print("\n  🎨  Generating (this takes 20-60s)...")
    try:
        (w, h), nbytes = generate_image(client, prompt, out_path)
    except Exception as e:
        print(f"  ❌  Image generation failed: {e}")
        sys.exit(1)

    rel = "/" + str(out_path.relative_to(REPO_ROOT)).replace("\\", "/")
    frontmatter_path = rel.replace("/assets/img", "")

    print(f"  ✅  Saved → {out_path.relative_to(REPO_ROOT)}")
    print(f"      {w}x{h}, {nbytes / 1024:.0f} KB, ratio {w / h:.3f}")
    print("\n" + "=" * 52)
    print("Frontmatter should read:")
    print(f"  img: {frontmatter_path}")


if __name__ == "__main__":
    main()
