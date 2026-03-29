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

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handlePasswordChange() {
    if (!currentUser) return;
    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    setChangingPassword(true);
    setPasswordMessage(null);
    try {
      await api.put(`/users/${currentUser.id}/password`, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordMessage({ type: "success", text: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || "Failed to change password.";
      setPasswordMessage({ type: "error", text: msg });
    } finally {
      setChangingPassword(false);
    }
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

          {passwordMessage && (
            <div className={`mb-3 p-3 rounded-lg text-sm ${
              passwordMessage.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            }`}>
              {passwordMessage.text}
            </div>
          )}

          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="rounded-md border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-secondary transition-colors"
            >
              Change Password
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => void handlePasswordChange()}
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {changingPassword ? "Changing..." : "Update Password"}
                </button>
                <button
                  onClick={() => { setShowPasswordForm(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPasswordMessage(null); }}
                  className="rounded-md border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
