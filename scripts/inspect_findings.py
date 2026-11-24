import json
import sys

patterns = sys.argv[1:] if len(sys.argv) > 1 else [""]
with open("findings_dump.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for pat in patterns:
    matches = [
        item for item in data.values()
        if pat.lower() in item.get("id", "").lower() or pat.lower() in item.get("title", "").lower()
    ]
    for m in matches:
        print(f"[{m.get('id')}] {m.get('title')} ({m.get('severity')})")
        print(f"Evidence: {m.get('evidence')}")
        print(f"Problem: {m.get('problem')}")
        print(f"Fix: {m.get('fix')}")
        print("-" * 60)
