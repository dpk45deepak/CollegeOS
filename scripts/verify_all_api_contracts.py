import json
import re

with open("inventory_summary.json", "r", encoding="utf-8") as f:
    inv = json.load(f)

backend_eps = inv["backend_endpoints"]
frontend_calls = inv["frontend_api_calls"]

# Build backend endpoint normalized list:
# { (method, regex): original_path }
backend_patterns = []
for bep in backend_eps:
    verb = bep["verb"]
    path = bep["path"]
    # Convert path params like :id, :paymentId to [^/]+
    reg = "^" + re.sub(r':[a-zA-Z0-9_]+', r'[^/]+', path) + "$"
    backend_patterns.append({
        "verb": verb,
        "pattern": re.compile(reg),
        "path": path,
        "file": bep["file"]
    })

results = []
for fc in frontend_calls:
    ep = fc["endpoint"].strip()
    # Replace JS template literals like ${id} with dummy param
    ep_norm = re.sub(r'\$\{.*?\}', 'param', ep)
    # Strip query parameters
    ep_norm = ep_norm.split("?")[0]
    if not ep_norm.startswith("/"):
        ep_norm = "/" + ep_norm
    
    method = fc["method"]
    file = fc["file"]

    matched = False
    matching_backend = None
    for bp in backend_patterns:
        if bp["verb"] == method and bp["pattern"].match(ep_norm):
            matched = True
            matching_backend = bp["path"]
            break
    
    # If not matched, check if path matches with different HTTP verb
    other_verb = None
    for bp in backend_patterns:
        if bp["pattern"].match(ep_norm):
            other_verb = bp["verb"]
            break

    results.append({
        "frontend_file": file,
        "frontend_endpoint": ep,
        "normalized_endpoint": ep_norm,
        "method": method,
        "matched": matched,
        "matching_backend": matching_backend,
        "other_verb": other_verb
    })

mismatches = [r for r in results if not r["matched"] and r["frontend_endpoint"] != "endpoint"]
print(f"Total analyzed frontend API calls: {len(results)}")
print(f"Mismatches found: {len(mismatches)}")
for m in mismatches:
    print(f"File: {m['frontend_file']}")
    print(f"  Call: {m['method']} {m['frontend_endpoint']} (Norm: {m['normalized_endpoint']})")
    if m['other_verb']:
        print(f"  Note: Exists in backend but under verb {m['other_verb']}")
    else:
        print(f"  Note: No matching backend path found!")
    print("-" * 50)
