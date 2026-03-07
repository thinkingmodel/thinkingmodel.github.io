import os
import yaml
import requests
import google.generativeai as genai
from pathlib import Path

# Setup paths
BASE_DIR = Path(__file__).parent.parent
DATA_FILE = BASE_DIR / "_data" / "papers.yml"

def generate_summary(paper, model):
    print(f"Generating summary via Gemini for '{paper.get('title')}'...")
    prompt = f"""You are an expert science communicator. Write exactly 20 lines about this research paper. Make it accessible to an intelligent non-specialist reader. Cover: what problem it solves, why it matters, the core insight, the method used, and the real-world implications. Each line should be a complete thought. No bullet points. No numbering. Just 20 flowing lines of prose.
CRITICAL INSTRUCTION: Do NOT alter the title of the paper in your response. 
Paper title: {paper.get('title')}
Authors: {paper.get('authors')}
Venue: {paper.get('venue')}
Abstract: {paper.get('abstract')}"""
Venue: {paper.get('venue')}
Abstract: {paper.get('abstract')}"""
    
    response = model.generate_content(prompt)
    return response.text

def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY environment variable is not set.")
        print("Please set it in your terminal before running this script.")
        return

    # Configure Gemini
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-pro-latest')

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
                summary = generate_summary(paper, model)
                paper["summary"] = summary
                
                # We strip DALL-E dependencies since we only have Gemini text model context here.
                # To maintain UI style, we instruct the front-end to render the domain-color skeleton instead.
                paper["imageName"] = "" 
                
                updated = True
                print(" -> Summary successfully generated.")
            except Exception as e:
                print(f" -> Error generating summary: {e}")
                
    if updated:
        # Save updated YAML
        print("Saving updates to papers.yml...")
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            yaml.dump(papers, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
        print("Done. Please commit your changes.")
    else:
        print("All papers already have summaries. Nothing to do.")

if __name__ == "__main__":
    main()
