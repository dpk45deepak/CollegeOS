const fs = require("fs");

// 1. Patch users.api.ts
let api = fs.readFileSync("Frontend/src/services/api/users.api.ts", "utf8");
api = api.replace(
  'updateStatus: async (id: string, status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION"): Promise<UserItem> => {\n    return apiClient<UserItem>(`/users/${id}/status`, {\n      method: "PATCH",\n      body: JSON.stringify({ status }),\n    });\n  },',
  `updateStatus: async (id: string, status: "ACTIVE" | "INACTIVE" | "LOCKED" | "PENDING_VERIFICATION" | "SUSPENDED"): Promise<UserItem> => {
    const normalized = status === "SUSPENDED" ? "INACTIVE" : status;
    return apiClient<UserItem>(\`/users/\${id}/status\`, {
      method: "PATCH",
      body: JSON.stringify({ status: normalized }),
    });
  },`
);

const oldCreate = `  create: async (dto: CreateUserDto): Promise<UserItem> => {
    return apiClient<UserItem>("/users", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },`;

const newCreate = `  create: async (dto: CreateUserDto): Promise<UserItem> => {
    const normalizedRoles = (dto.roles || []).map((r) => {
      if (r === "ADMIN") return "COLLEGE_ADMIN";
      if (r === "EXAM_OFFICER") return "EXAM_CONTROLLER";
      if (r === "LIBRARIAN") return "LIBRARY_STAFF";
      return r;
    });

    return apiClient<UserItem>("/users", {
      method: "POST",
      body: JSON.stringify({
        ...dto,
        roles: normalizedRoles,
      }),
    });
  },`;

api = api.replace(/\r\n/g, "\n");
if (api.includes(oldCreate.replace(/\r\n/g, "\n"))) {
  api = api.replace(oldCreate.replace(/\r\n/g, "\n"), newCreate);
}

fs.writeFileSync("Frontend/src/services/api/users.api.ts", api);
console.log("Successfully patched users.api.ts");

// 2. Patch admin/users/page.tsx
let page = fs.readFileSync("Frontend/src/app/(admin)/admin/users/page.tsx", "utf8");
page = page.replace(
  'const [userRole, setUserRole] = useState("ADMIN");',
  'const [userRole, setUserRole] = useState("COLLEGE_ADMIN");'
);

page = page.replace(
  'const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";',
  'const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";'
);

const oldSelect = `<select value={userRole} onChange={(e) => setUserRole(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
                <option value="ADMIN">Administrator</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="PLACEMENT_OFFICER">Placement Officer</option>
                <option value="EXAM_OFFICER">Examination Officer</option>
                <option value="LIBRARIAN">Librarian</option>
              </select>`;

const newSelect = `<select value={userRole} onChange={(e) => setUserRole(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
                <option value="COLLEGE_ADMIN">Administrator</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="PLACEMENT_OFFICER">Placement Officer</option>
                <option value="EXAM_CONTROLLER">Examination Officer</option>
                <option value="LIBRARY_STAFF">Librarian</option>
              </select>`;

page = page.replace(/\r\n/g, "\n");
if (page.includes(oldSelect.replace(/\r\n/g, "\n"))) {
  page = page.replace(oldSelect.replace(/\r\n/g, "\n"), newSelect);
}

fs.writeFileSync("Frontend/src/app/(admin)/admin/users/page.tsx", page);
console.log("Successfully patched admin/users/page.tsx");
