import os
import re
import json

base_dir = os.path.abspath(".")
frontend_dir = os.path.join(base_dir, "Frontend")
backend_dir = os.path.join(base_dir, "Backend")

# 1. Discover Frontend Routes
frontend_routes = []
app_dir = os.path.join(frontend_dir, "src", "app")
for root, dirs, files in os.walk(app_dir):
    for f in files:
        if f in ("page.tsx", "page.jsx", "route.ts", "route.js"):
            rel = os.path.relpath(os.path.join(root, f), app_dir)
            route_path = "/" + os.path.dirname(rel).replace("\\", "/")
            if route_path == "/.":
                route_path = "/"
            frontend_routes.append({"file": os.path.relpath(os.path.join(root, f), base_dir), "route": route_path})

# 2. Discover Frontend API Calls (more robust regex for apiClient)
frontend_api_calls = []
# Match: apiClient<...>(ENDPOINT, { ... method: "POST" ... })
pattern = re.compile(r'apiClient(?:<[^>]+>)?\(\s*([`\'"][^`\'"]+[`\'"]|\`[^\`]+\`|[a-zA-Z0-9_\.]+)(?:,\s*(\{[\s\S]*?\}))?\)', re.MULTILINE)

api_src_dir = os.path.join(frontend_dir, "src")
for root, dirs, files in os.walk(api_src_dir):
    for f in files:
        if f.endswith((".ts", ".tsx", ".js", ".jsx")):
            fp = os.path.join(root, f)
            with open(fp, "r", encoding="utf-8", errors="ignore") as file_obj:
                content = file_obj.read()
                for m in pattern.finditer(content):
                    raw_endpoint = m.group(1).strip()
                    options_block = m.group(2) if m.group(2) else ""
                    
                    method = "GET"
                    method_match = re.search(r'method:\s*["\']([A-Z]+)["\']', options_block)
                    if method_match:
                        method = method_match.group(1)
                    
                    # Clean endpoint string
                    endpoint = raw_endpoint.strip("\"'`")
                    frontend_api_calls.append({
                        "file": os.path.relpath(fp, base_dir),
                        "endpoint": endpoint,
                        "method": method
                    })

# 3. Discover Backend Controllers & Endpoints
backend_endpoints = []
src_dir = os.path.join(backend_dir, "src")
controller_decorator_regex = re.compile(r'@Controller\(\s*(?:[\'"`]([^\'"`]*)[\'"`])?\s*\)', re.MULTILINE)
method_decorator_regex = re.compile(r'@(Get|Post|Put|Delete|Patch)\(\s*(?:[\'"`]([^\'"`]*)[\'"`])?\s*\)', re.MULTILINE)

for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith(".controller.ts"):
            fp = os.path.join(root, f)
            with open(fp, "r", encoding="utf-8", errors="ignore") as file_obj:
                content = file_obj.read()
                ctrl_match = controller_decorator_regex.search(content)
                prefix = ctrl_match.group(1) if ctrl_match and ctrl_match.group(1) else ""
                
                lines = content.splitlines()
                for i, line in enumerate(lines):
                    m = method_decorator_regex.search(line)
                    if m:
                        http_verb = m.group(1).upper()
                        subpath = m.group(2) if m.group(2) else ""
                        full_path = f"/{prefix}/{subpath}".replace("//", "/").rstrip("/")
                        backend_endpoints.append({
                            "file": os.path.relpath(fp, base_dir),
                            "line": i + 1,
                            "verb": http_verb,
                            "prefix": prefix,
                            "subpath": subpath,
                            "path": full_path
                        })

# 4. Discover Prisma Models
prisma_schema = os.path.join(backend_dir, "prisma", "schema.prisma")
models = []
if os.path.exists(prisma_schema):
    with open(prisma_schema, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            if line.startswith("model "):
                models.append(line.split()[1])

inventory = {
    "frontend_routes_count": len(frontend_routes),
    "frontend_routes": frontend_routes,
    "frontend_api_calls_count": len(frontend_api_calls),
    "frontend_api_calls": frontend_api_calls,
    "backend_endpoints_count": len(backend_endpoints),
    "backend_endpoints": backend_endpoints,
    "prisma_models_count": len(models),
    "prisma_models": models
}

with open("inventory_summary.json", "w", encoding="utf-8") as f:
    json.dump(inventory, f, indent=2)

print(f"Inventory Summary:")
print(f"- Frontend Routes: {len(frontend_routes)}")
print(f"- Frontend API Calls: {len(frontend_api_calls)}")
print(f"- Backend Endpoints: {len(backend_endpoints)}")
print(f"- Prisma Models: {len(models)}")
