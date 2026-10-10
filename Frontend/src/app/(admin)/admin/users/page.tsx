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
import { ErrorState } from "@/components/ui/error-state";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { data: users, isLoading, error, refetch } = useQuery({
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

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  if (error || !users) {
    return (
      <ErrorState
        message="Could not load institutional user directory. Please verify server connection."
        onRetry={refetch}
      />
    );
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
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-semibold"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="TEACHER">Teachers</option>
            <option value="HOD">HODs</option>
            <option value="ADMIN">Administrators</option>
            <option value="PLACEMENT_OFFICER">Placement Officers</option>
            <option value="ACCOUNTANT">Accountants</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No users found matching the search criteria.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
                <tr>
                  <th className="p-3 pl-4">Name / ID</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Primary Role</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 pr-4 text-right">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20">
                    <td className="p-3 pl-4 font-semibold text-foreground">
                      {u.name}
                    </td>
                    <td className="p-3 font-mono text-muted-foreground">
                      {u.email}
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-foreground">
                      {u.department}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 pr-4 text-right text-muted-foreground font-mono">
                      {u.joinedDate || "Active"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Dialog
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="Add Institutional User"
        description="Provision a new student, teacher, HOD, or staff account with role-based permissions."
      >
        <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold block mb-1">Full Name</label>
            <Input
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Email Address</label>
            <Input
              type="email"
              placeholder="r.sharma@sdcet.example"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Assigned Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as ManagedUser["role"])}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="HOD">HOD</option>
                <option value="ADMIN">Administrator</option>
                <option value="PLACEMENT_OFFICER">Placement Officer</option>
                <option value="ACCOUNTANT">Accountant</option>
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="CSE">Computer Science</option>
                <option value="CE">Civil Engineering</option>
                <option value="GEN">General Studies</option>
                <option value="DS">Data Science</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddUserOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createMutation.isPending}>
              Create User
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
