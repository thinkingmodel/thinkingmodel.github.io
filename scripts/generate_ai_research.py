#!/usr/bin/env python3
"""
generate_ai_research.py

Generates AI summaries (GPT-4o) and DALL-E 3 images for each paper
in _data/papers.yml, then writes results back into that YAML file.

Usage:
    python scripts/generate_ai_research.py
    python scripts/generate_ai_research.py --force      # regenerate all
    python scripts/generate_ai_research.py --id kanite  # one paper only

Requirements:
    pip install openai pyyaml requests python-dotenv
"""

import os
import sys
import argparse
import yaml
import requests
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from openai import OpenAI

# ── Config ────────────────────────────────────────────
REPO_ROOT  = Path(__file__).parent.parent
PAPERS_YML = REPO_ROOT / "_data" / "papers.yml"
IMAGES_DIR = REPO_ROOT / "assets" / "research" / "images"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)


def get_client():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("❌  OPENAI_API_KEY not set.")
        print("    Run:  export OPENAI_API_KEY='sk-...'")
        print("    Or:   Create .env with  OPENAI_API_KEY=sk-...")
        sys.exit(1)
    return OpenAI(api_key=api_key)


def load_papers():
    with open(PAPERS_YML, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def save_papers(data):
    with open(PAPERS_YML, "w", encoding="utf-8") as f:
        yaml.dump(data, f,
                  default_flow_style=False,
                  allow_unicode=True,
                  sort_keys=False)
    print(f"  💾  papers.yml saved.")


def generate_summary(client, paper):
    """Generate a 20-line prose summary using GPT-4o."""
    authors_str = ", ".join(a["name"] for a in paper.get("authors", []))

    prompt = (
        "You are an expert science communicator. "
        "Write exactly 20 lines about this research paper. "
        "Make it accessible to an intelligent non-specialist reader. "
        "Cover: what problem it solves, why it matters, the core insight, the method used, and the real-world implications. "
        "Each line should be a complete thought. No bullet points. No numbering. Just 20 flowing lines of prose.\n"
        "CRITICAL INSTRUCTION: Do NOT alter the title of the paper in your response. exactly use the title provided.\n"
        f"Paper title: {paper['title']}\n"
        f"Authors: {authors_str}\n"
        f"Venue: {paper['venue']}\n"
        f"Domain: {paper['domain']}\n"
    )

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=950,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()


def generate_image(client, paper):
    """Generate a DALL-E 3 landscape image and save to disk. Returns relative path."""
    image_filename = f"{paper['id']}.png"
    image_path = IMAGES_DIR / image_filename

    prompt = (
        f"A cinematic horizontal banner representing the research concept: "
        f"\"{paper['title']}\". "
        "IMPORTANT: Place the key visual element centered horizontally, "
        "concentrated in the upper-center third of the frame. "
        "The bottom third should fade into deep darkness. "
        "Style: deep cosmic dark background, glowing abstract data nodes "
        "as constellations with luminous connecting edges, violet and teal "
        "gradient light. Photorealistic, surreal, no text, no labels, "
        "no people, no faces. Ultra high detail. "
        "Mood: mysterious, intelligent, like a window into an idea."
    )

    response = client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        n=1,
        size="1792x1024",
        quality="hd",
        style="vivid",
    )

    image_url = response.data[0].url
    img_resp = requests.get(image_url, timeout=60)
    img_resp.raise_for_status()

    with open(image_path, "wb") as f:
        f.write(img_resp.content)

    relative = image_path.relative_to(REPO_ROOT)
    return "/" + str(relative).replace("\\", "/")


def process_paper(client, paper, force=False):
    paper_id = paper.get("id", "?")

    if paper.get("has_ai_content") and not force:
        print(f"  ⏭️   Skipping {paper_id!r} (already done — use --force to redo)")
        return paper

    print(f"\n🔬  Processing: {paper['title'][:65]}...")

    try:
        print("  📝  Generating summary (GPT-4o)...")
        paper["summary"] = generate_summary(client, paper)
        print("  ✅  Summary done.")
    except Exception as e:
        print(f"  ❌  Summary failed: {e}")
        paper["summary"] = ""
        paper["has_ai_content"] = False
        return paper

    try:
        print("  🎨  Generating image (DALL-E 3)...")
        paper["image_path"] = generate_image(client, paper)
        print(f"  ✅  Image saved → {paper['image_path']}")
    except Exception as e:
        print(f"  ❌  Image failed: {e}")
        paper["image_path"] = ""

    paper["has_ai_content"] = True
    return paper


def main():
    parser = argparse.ArgumentParser(
        description="Generate AI content for research papers"
    )
    parser.add_argument("--force", action="store_true",
                        help="Regenerate even if has_ai_content is true")
    parser.add_argument("--id", type=str, default=None,
                        help="Process only the paper with this ID")
    args = parser.parse_args()

    print("🚀  Research AI Generator")
    print("=" * 52)

    data   = load_papers()
    papers = data.get("papers", [])
    if not papers:
        print("❌  No papers found in _data/papers.yml")
        sys.exit(1)

    print(f"📚  Found {len(papers)} paper(s) in papers.yml")

    # Filter to a single ID if requested
    target_ids = None
    if args.id:
        target_ids = {args.id}
        matches = [p for p in papers if p["id"] == args.id]
        if not matches:
            avail = [p["id"] for p in papers]
            print(f"❌  No paper with id {args.id!r}. Available: {avail}")
            sys.exit(1)
        print(f"🎯  Targeting only: {args.id!r}")

    needs = [
        p for p in papers
        if (target_ids is None or p["id"] in target_ids)
        and (not p.get("has_ai_content") or args.force)
    ]

    if not needs:
        print("✨  All targeted papers already have AI content.")
        print("    Use --force to regenerate.")
        return

    print(f"⚡  Will process {len(needs)} paper(s).")
    client = get_client()

    for paper in data["papers"]:
        if target_ids and paper["id"] not in target_ids:
            continue
        if not paper.get("has_ai_content") or args.force:
            updated = process_paper(client, paper, force=args.force)
            paper.update(updated)
            # Save after every paper so a crash mid-run doesn't lose work
            save_papers(data)

    print("\n" + "=" * 52)
    print("✅  Generation complete!")
    print(f"📁  Images → assets/research/images/")
    print(f"📄  papers.yml updated")
    print("\nNext steps:")
    print("  git add _data/papers.yml assets/research/")
    print("  git commit -m 'Add AI-generated research content'")
    print("  git push")


if __name__ == "__main__":
    main()
