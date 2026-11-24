import os
import re
import json

base_dir = os.path.abspath(".")
frontend_dir = os.path.join(base_dir, "Frontend")
backend_dir = os.path.join(base_dir, "Backend")

with open("inventory_summary.json", "r", encoding="utf-8") as f:
    inventory = json.load(f)

backend_endpoints = inventory["backend_endpoints"]
# Create lookup map of backend endpoints: (METHOD, normalized_path)
# e.g., ("GET", "/students/me/fees")
backend_map = {}
for ep in backend_endpoints:
    verb = ep["verb"]
    # normalize path by replacing :param with {param} or *
    norm_path = re.sub(r':[a-zA-Z0-9_]+', '{param}', ep["path"])
    backend_map[(verb, norm_path)] = ep

# Also index by subpath/prefix
backend_paths = set(ep["path"] for ep in backend_endpoints)

print(f"Loaded {len(backend_endpoints)} backend endpoints.")

# Analyze Frontend Services
frontend_api_dir = os.path.join(frontend_dir, "src", "services", "api")
lib_api_dir = os.path.join(frontend_dir, "src", "lib", "api")

contract_discrepancies = []
state_discrepancies = []

# Scan all frontend ts/tsx files for Query Keys and Invalidation
query_keys_defined = set()
query_keys_invalidated = set()

qk_use_regex = re.compile(r'queryKey:\s*\[\s*["\']([^"\']+)["\']', re.MULTILINE)
qk_inv_regex = re.compile(r'invalidateQueries\(\s*\{\s*queryKey:\s*\[\s*["\']([^"\']+)["\']', re.MULTILINE)

for root, dirs, files in os.walk(os.path.join(frontend_dir, "src")):
    for f in files:
        if f.endswith((".ts", ".tsx")):
            fp = os.path.join(root, f)
            with open(fp, "r", encoding="utf-8", errors="ignore") as fo:
                content = fo.read()
                for qk in qk_use_regex.findall(content):
                    query_keys_defined.add((qk, os.path.relpath(fp, base_dir)))
                for qk in qk_inv_regex.findall(content):
                    query_keys_invalidated.add((qk, os.path.relpath(fp, base_dir)))

print(f"Discovered {len(query_keys_defined)} queryKey definitions and {len(query_keys_invalidated)} invalidations.")

# Check for defined query keys that are never invalidated after mutation, or invalidations that don't match any query
defined_keys_names = set(k[0] for k in query_keys_defined)
invalidated_keys_names = set(k[0] for k in query_keys_invalidated)

mismatched_invalidations = invalidated_keys_names - defined_keys_names
print(f"Invalidations with no corresponding defined queryKey: {mismatched_invalidations}")

# Now analyze API endpoints called in frontend
for call in inventory["frontend_api_calls"]:
    endpoint = call["endpoint"]
    method = call["method"]
    file_path = call["file"]
    
    # Skip dynamic template strings that couldn't be parsed statically
    if "$" in endpoint or "{" in endpoint or "+" in endpoint:
        # Normalize template literal
        clean_ep = re.sub(r'\$\{.*?\}', '{param}', endpoint)
    else:
        clean_ep = endpoint
    
    # Strip query parameters for endpoint matching
    clean_ep_no_query = clean_ep.split("?")[0]
    if not clean_ep_no_query.startswith("/"):
        clean_ep_no_query = "/" + clean_ep_no_query

    # Check if there is a match in backend
    matched = False
    for (b_verb, b_norm), ep_info in backend_map.items():
        if b_verb == method:
            # Check pattern match
            regex_pattern = "^" + re.escape(b_norm).replace(r'\{param\}', r'[^/]+') + "$"
            if re.match(regex_pattern, clean_ep_no_query):
                matched = True
                break
    
    if not matched:
        # Test if it matched under another HTTP verb or prefix
        contract_discrepancies.append({
            "frontend_file": file_path,
            "endpoint": endpoint,
            "method": method,
            "clean_endpoint": clean_ep_no_query,
            "issue": "No matching backend endpoint found for this method and path"
        })

print(f"Found {len(contract_discrepancies)} potential contract discrepancies.")
with open("contract_audit_raw.json", "w", encoding="utf-8") as f:
    json.dump({
        "contract_discrepancies": contract_discrepancies,
        "query_keys_defined": list(query_keys_defined),
        "query_keys_invalidated": list(query_keys_invalidated),
        "mismatched_invalidations": list(mismatched_invalidations)
    }, f, indent=2)
