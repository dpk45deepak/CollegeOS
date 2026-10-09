"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, ManagedUser } from "@/lib/api/admin";
import {
  Users,
  Plus,
  Search,
  Download,
  Upload,
  UserCheck,
  Shield,
  Filter,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin_users"],
    queryFn: () => adminApi.getUsers(),
  });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ManagedUser["role"]>("STUDENT");
  const [department, setDepartment] = useState("CSE");

  const createMutation = useMutation({
    mutationFn: (user: Partial<ManagedUser>) => adminApi.createUser(user),
    onSuccess: () => {
      setIsAddUserOpen(false);
      setName("");
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
    },
  });

  if (isLoading || !users) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    createMutation.mutate({ name, email, role, department });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            User Directory & Access Control (RBAC)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage student registrations, faculty credentials, HOD appointments, and administrative rights.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("Simulating Bulk CSV Student Roster Import...")}
            className="text-xs gap-1.5 h-8"
          >
            <Upload className="h-3.5 w-3.5" /> Import CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("Exporting Roster CSV...")}
            className="text-xs gap-1.5 h-8"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddUserOpen(true)}
            className="text-xs gap-1.5 h-8 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add User
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-3.5 w-3.5" />}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs w-full sm:w-auto"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
            <option value="HOD">HOD</option>
            <option value="ADMIN">Admin</option>
            <option value="PLACEMENT_OFFICER">Placement Officer</option>
            <option value="ACCOUNTANT">Accountant</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
              <tr>
                <th className="p-3 pl-4">Name</th>
                <th className="p-3">Institutional Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Department</th>
                <th className="p-3">Status</th>
                <th className="p-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20">
                  <td className="p-3 pl-4 font-semibold text-foreground">{user.name}</td>
                  <td className="p-3 font-mono text-muted-foreground">{user.email}</td>
                  <td className="p-3">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">{user.department}</td>
                  <td className="p-3">
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                      {user.status}
                    </span>
                  </td>
                  <td className="p-3 pr-4 text-right">
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add User Modal Dialog */}
      <Dialog
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="Add Institutional User"
        description="Creates an authorized account with role-based dashboard permissions."
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-foreground block">Full Name</label>
            <Input
              placeholder="e.g. Rohini Chatterjee"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">Institutional Email</label>
            <Input
              type="email"
              placeholder="e.g. rohini.c@apex.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as ManagedUser["role"])}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="HOD">HOD</option>
                <option value="ADMIN">Admin</option>
                <option value="PLACEMENT_OFFICER">Placement Officer</option>
                <option value="ACCOUNTANT">Accountant</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="CSE">Computer Science</option>
                <option value="ECE">Electronics</option>
                <option value="ME">Mechanical</option>
                <option value="Administration">Administration</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={createMutation.isPending}>
              Create User
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
