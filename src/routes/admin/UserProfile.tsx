import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";

export function UserProfile() {
  const currentUser = useAuthStore((s) => s.user);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.name || "");
    setEmail(currentUser.email || "");
    setRole(currentUser.role || "");
    setAvatarUrl(currentUser.avatar_url || "");
  }, [currentUser]);

  async function handleSave() {
    if (!currentUser) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.put(`/users/${currentUser.id}`, {
        name: name.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
      });
      // Update local store
      useAuthStore.getState().setUser?.({ ...currentUser, name: name.trim() || currentUser.name, avatar_url: avatarUrl.trim() || currentUser.avatar_url });
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch {
      setMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  }

  function handlePasswordChange() {
    // Redirect to a password change flow — for now, inform the user
    setMessage({ type: "error", text: "Password change is not yet supported via the admin UI." });
  }

  if (!currentUser) {
    return (
      <div className="text-center py-12 text-text-tertiary">Loading...</div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Profile</h1>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold">
            {name.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-secondary mb-1">Avatar URL</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
            />
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full rounded-md border border-border px-3 py-2 text-sm bg-surface-secondary text-text-tertiary"
          />
          <p className="text-xs text-text-tertiary mt-1">Email cannot be changed here.</p>
        </div>

        {/* Role (read-only display) */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-primary-100 text-primary-800 capitalize">
              {role}
            </span>
          </div>
          <p className="text-xs text-text-tertiary mt-1">Role changes must be made by an admin in the Users page.</p>
        </div>

        {/* Save button */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Password section */}
        <div className="pt-4 border-t border-border">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Security</h2>
          <button
            onClick={handlePasswordChange}
            className="rounded-md border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-secondary transition-colors"
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
}
