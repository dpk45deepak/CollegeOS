import json
import os

with open('findings_dump.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total findings: {len(data)}")
for i, (fid, f) in enumerate(data.items()):
    sev = f.get('severity', 'Unknown')
    title = f.get('title', '')
    print(f"{i+1:3d}. [{sev:8s}] {fid:12s} : {title}")
