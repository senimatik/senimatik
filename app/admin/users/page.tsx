"use client";

import { useState, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  DotsThreeVerticalIcon,
  ArrowSquareOutIcon,
  SpinnerIcon,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/lib/context/UserContext";
import { Doc, Id } from "@/convex/_generated/dataModel";

type UserRole = "user" | "creator" | "admin" | "super_admin";

const ROLE_BADGE: Record<UserRole, string> = {
  user: "bg-zinc-100 text-zinc-500",
  creator: "bg-blue-50 text-blue-600",
  admin: "bg-purple-50 text-purple-600",
  super_admin: "bg-orange-50 text-orange-600",
};

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const { role: callerRole, user: currentUser } = useCurrentUser();

  const users = useQuery(api.users.listUsers);

  const updateRole = useMutation(api.users.updateRole);

  async function handleRoleChange(userId: Id<"users">, currentRole: string, newRole: UserRole) {
    // Prevent self-demotion
    if (currentUser && userId === currentUser._id) {
      alert("You cannot change your own role.");
      return;
    }

    // Confirmation dialog
    if (!window.confirm(`Change role from "${currentRole.replace("_", " ")}" to "${newRole.replace("_", " ")}"?`)) {
      return;
    }

    setChangingRole(userId);
    try {
      await updateRole({ targetUserId: userId, newRole });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setChangingRole(null);
    }
  }

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.walletAddress.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.displayName?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const roleOptions: UserRole[] = callerRole === "super_admin"
    ? ["user", "creator", "admin", "super_admin"]
    : ["user", "creator"];

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-black/10" />
            <span className="text-[10px] font-pixel text-zinc-400 uppercase tracking-widest leading-none">
              Entity Management
            </span>
          </div>
          <h1 className="text-5xl font-medium tracking-tighter uppercase leading-none">
            Users
          </h1>
        </div>

        <div className="w-full md:w-auto flex items-center justify-center gap-4 mt-4 md:mt-0">
          <div className="relative w-full md:w-72">
            <MagnifyingGlassIcon
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by wallet or email..."
              className="mt-0 pl-10"
            />
          </div>
        </div>
      </header>

      <div className="border border-zinc-100 rounded-[32px] overflow-x-auto bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/50">
              {["Identity", "Role", "Registry Date", "Actions"].map((head) => (
                <th
                  key={head}
                  className="px-8 py-6 text-[10px] font-pixel uppercase tracking-widest text-zinc-400 font-medium"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {users === undefined && (
              <tr>
                <td colSpan={4} className="px-8 py-12 text-center">
                  <SpinnerIcon size={24} className="animate-spin text-zinc-300 mx-auto" />
                </td>
              </tr>
            )}
            {filtered.length === 0 && users !== undefined && (
              <tr>
                <td colSpan={4} className="px-8 py-12 text-center">
                  <p className="font-pixel text-[10px] uppercase tracking-widest text-zinc-300">No users found</p>
                </td>
              </tr>
            )}
            {filtered.map((user: Doc<"users">) => (
              <tr
                key={user._id}
                className="group hover:bg-zinc-50/30 transition-colors"
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-pixel uppercase">
                      {user.walletAddress.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {user.displayName ?? user.email ?? "Anonymous"}
                      </p>
                      <p className="text-[11px] font-mono text-zinc-400 italic leading-none">
                        {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-6)}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-8 py-6">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user._id, user.role, e.target.value as UserRole)}
                    disabled={changingRole === user._id || currentUser?._id === user._id}
                    className={`text-[10px] font-pixel uppercase tracking-widest px-3 py-1.5 rounded-full border cursor-pointer disabled:opacity-50 ${ROLE_BADGE[user.role as UserRole] ?? "bg-zinc-100 text-zinc-500"}`}
                  >
                    {roleOptions.map((r) => (
                      <option key={r} value={r}>{r.replace("_", " ")}</option>
                    ))}
                  </select>
                </td>

                <td className="px-8 py-6">
                  <span className="text-xs font-light text-zinc-400">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric"
                    })}
                  </span>
                </td>

                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => window.open(`/profile/${user.walletAddress}`, "_blank")}
                      className="p-2 rounded-lg hover:bg-zinc-50 text-zinc-400 hover:text-black transition-colors"
                    >
                      <ArrowSquareOutIcon size={18} weight="thin" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-zinc-50 text-zinc-400 hover:text-black transition-colors">
                      <DotsThreeVerticalIcon size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="p-8 bg-zinc-50/50 border-t border-zinc-100 flex md:flex-row flex-col gap-4 md:gap-0 justify-between items-center">
          <p className="text-[10px] font-pixel uppercase tracking-widest text-zinc-400">
            Showing {filtered.length} of {users?.length ?? 0} users
          </p>
        </div>
      </div>
    </div>
  );
}
