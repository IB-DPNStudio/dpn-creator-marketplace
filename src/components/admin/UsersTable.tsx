"use client";

import React, { useState } from "react";
import { inviteUser, updateUserRole } from "@/app/actions/users";
import { Loader2, Mail, Shield, User, UserPlus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UsersTable({ profiles, currentUserRole }: { profiles: any[], currentUserRole: string }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("agency_user");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [tempRole, setTempRole] = useState("");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsInviting(true);
    setInviteMessage(null);

    const result = await inviteUser(inviteEmail, inviteRole);

    setIsInviting(false);
    if (result.success) {
      setInviteMessage({ type: 'success', text: 'Invitation sent successfully!' });
      setInviteEmail("");
    } else {
      setInviteMessage({ type: 'error', text: result.error || 'Failed to send invitation.' });
    }
  };

  const handleUpdateRole = async (userId: string) => {
    setIsUpdatingRole(true);
    const result = await updateUserRole(userId, tempRole);
    setIsUpdatingRole(false);
    
    if (result.success) {
      setEditingUserId(null);
    } else {
      alert("Failed to update role: " + result.error);
    }
  };

  const canManageRoles = currentUserRole === 'super_admin' || currentUserRole === 'dpn_sales';

  return (
    <div className="space-y-8">
      {/* Invite Section */}
      <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-dentsu/10 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-dentsu" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-heading">Invite New User</h2>
            <p className="text-sm text-muted-foreground">Send an exclusive invitation to join the DPN network.</p>
          </div>
        </div>

        <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                type="email" 
                placeholder="partner@agency.com" 
                className="pl-9"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="w-full md:w-64 space-y-2">
            <label className="text-sm font-medium">Role</label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="agency_user">Agency Partner</option>
              <option value="creator">Creator</option>
              {currentUserRole === 'super_admin' && <option value="dpn_sales">DPN Sales</option>}
              {currentUserRole === 'super_admin' && <option value="super_admin">Super Admin</option>}
            </select>
          </div>
          <Button type="submit" disabled={isInviting} className="w-full md:w-auto bg-dentsu hover:bg-dentsu/90 text-white">
            {isInviting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
            Send Invite
          </Button>
        </form>
        {inviteMessage && (
          <div className={`mt-4 p-3 rounded text-sm ${inviteMessage.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
            {inviteMessage.text}
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold font-heading">Network Users</h2>
          <div className="text-sm text-muted-foreground">{profiles.length} total users</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-4 font-bold">User</th>
                <th className="p-4 font-bold">Role</th>
                <th className="p-4 font-bold text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {profiles.map(profile => (
                <tr key={profile.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm text-foreground uppercase border border-border">
                        {profile.full_name?.[0] || profile.email?.[0] || <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{profile.full_name || 'Pending Invite'}</div>
                        <div className="text-xs text-muted-foreground">{profile.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {editingUserId === profile.id ? (
                      <div className="flex items-center gap-2">
                        <select 
                          className="text-xs px-2 py-1 rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                          value={tempRole}
                          onChange={(e) => setTempRole(e.target.value)}
                        >
                          <option value="agency_user">Agency Partner</option>
                          <option value="creator">Creator</option>
                          <option value="dpn_sales">DPN Sales</option>
                          {currentUserRole === 'super_admin' && <option value="super_admin">Super Admin</option>}
                        </select>
                        <button disabled={isUpdatingRole} onClick={() => handleUpdateRole(profile.id)} className="p-1 text-green-500 hover:bg-green-500/10 rounded">
                          {isUpdatingRole ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        </button>
                        <button disabled={isUpdatingRole} onClick={() => setEditingUserId(null)} className="p-1 text-red-500 hover:bg-red-500/10 rounded">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          profile.role === 'super_admin' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                          profile.role === 'dpn_sales' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                          'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                        }`}>
                          {profile.role === 'super_admin' && <Shield className="w-3 h-3 mr-1" />}
                          {profile.role?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </div>
                        {canManageRoles && profile.id && (
                          <button 
                            onClick={() => {
                              setTempRole(profile.role);
                              setEditingUserId(profile.id);
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground underline decoration-dotted underline-offset-4"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-right text-sm text-muted-foreground">
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                  </td>
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
