import os
import yaml
import json
import requests
from pathlib import Path

# Setup paths
BASE_DIR = Path(__file__).parent.parent
DATA_FILE = BASE_DIR / "_data" / "papers.yml"
IMG_DIR = BASE_DIR / "assets" / "img" / "research"

def generate_summary(paper, api_key):
    print(f"Generating summary for '{paper.get('title')}'...")
    prompt = f"""You are an expert science communicator. Write exactly 20 lines about this research paper. Make it accessible to an intelligent non-specialist reader. Cover: what problem it solves, why it matters, the core insight, the method used, and the real-world implications. Each line should be a complete thought. No bullet points. No numbering. Just 20 flowing lines of prose.
Paper title: {paper.get('title')}
Authors: {paper.get('authors')}
Venue: {paper.get('venue')}
Abstract: {paper.get('abstract')}"""
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    payload = {
        "model": "gpt-4o",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 800,
        "temperature": 0.7
    }
    res = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
    res.raise_for_status()
    data = res.json()
    return data["choices"][0]["message"]["content"]

def generate_image(paper, api_key):
    print(f"Generating image for '{paper.get('title')}'...")
    prompt = f"""A cinematic, wide-format scientific visualization representing the research concept: "{paper.get('title')}". Style: dark cosmic aesthetic, deep navy and violet background, glowing data flows, abstract neural network nodes, causal graph structures rendered as constellations, photorealistic yet surreal. Cinematic lighting. 16:9 landscape orientation. No text. No labels. No people. Pure conceptual scientific art. High detail, moody, editorial quality."""
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    payload = {
        "model": "dall-e-3",
        "prompt": prompt,
        "n": 1,
        "size": "1792x1024",
        "quality": "hd",
        "style": "vivid"
    }
    res = requests.post("https://api.openai.com/v1/images/generations", headers=headers, json=payload)
    res.raise_for_status()
    data = res.json()
    return data["data"][0]["url"]

def download_image(url, save_path):
    print(f"Downloading image to {save_path.name}...")
    res = requests.get(url, stream=True)
    res.raise_for_status()
    with open(save_path, 'wb') as f:
        for chunk in res.iter_content(chunk_size=8192):
            f.write(chunk)

def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY environment variable is not set.")
        print("Please set it in your terminal before running this script.")
        return

    # Ensure image directory exists
    IMG_DIR.mkdir(parents=True, exist_ok=True)

    # Load YAML
    if not DATA_FILE.exists():
        print(f"ERROR: Cannot find data file at {DATA_FILE}")
        return
        
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        papers = yaml.safe_load(f) or []

    updated = False
    
    for paper in papers:
        # Check if we need to generate summary
        if not paper.get("summary"):
            try:
                summary = generate_summary(paper, api_key)
                paper["summary"] = summary
                updated = True
                print(" -> Summary successfully generated.")
            except Exception as e:
                print(f" -> Error generating summary: {e}")

        # Check if we need to generate image
        if not paper.get("imageName"):
            try:
                image_url = generate_image(paper, api_key)
                image_filename = f"{paper['id']}.jpg"
                save_path = IMG_DIR / image_filename
                download_image(image_url, save_path)
                
                paper["imageName"] = image_filename
                updated = True
                print(f" -> Image saved locally as {image_filename}")
            except Exception as e:
                print(f" -> Error generating image: {e}")
                
    if updated:
        # Save updated YAML
        print("Saving updates to papers.yml...")
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            yaml.dump(papers, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
        print("Done. Please commit your changes.")
    else:
        print("All papers already have summaries and images. Nothing to do.")

if __name__ == "__main__":
    main()
