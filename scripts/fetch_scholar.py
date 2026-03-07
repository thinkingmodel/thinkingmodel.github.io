import requests
from bs4 import BeautifulSoup
import json

url = 'https://scholar.google.com/citations?user=mPkYJu8AAAAJ&hl=en&sortby=pubdate'
res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
soup = BeautifulSoup(res.text, 'html.parser')
papers = []
for row in soup.select('.gsc_a_tr'):
    title = row.select_one('.gsc_a_at').text if row.select_one('.gsc_a_at') else ''
    authors = row.select_one('.gsc_a_at + div').text if row.select_one('.gsc_a_at + div') else ''
    venue = row.select_one('.gsc_a_at + div + div').text if row.select_one('.gsc_a_at + div + div') else ''
    papers.append({'title': title, 'authors': authors, 'venue': venue})
print(json.dumps(papers, indent=2))
