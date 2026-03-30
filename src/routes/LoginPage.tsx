import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth";
import { api, ApiError } from "@/lib/api";

function getPasswordStrength(pw: string): { label: string; color: string } {
  if (pw.length < 8) return { label: "Too short", color: "text-red-500" };
  let score = 0;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Weak", color: "text-red-500" };
  if (score <= 2) return { label: "Fair", color: "text-yellow-500" };
  if (score <= 3) return { label: "Good", color: "text-green-500" };
  return { label: "Strong", color: "text-green-600" };
}

type View = "login" | "register" | "forgot" | "forgot-success" | "reset";

export function LoginPage() {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (view === "register" && password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      if (view === "register") {
        await register(email, password, name || undefined);
        void navigate({ to: "/admin" });
      } else {
        await login(email, password);
        void navigate({ to: "/admin" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setView("forgot-success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send reset email");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/api/auth/reset-password", { token: resetToken, password });
      setSuccess("Password has been reset. You can now sign in.");
      setView("login");
      setPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reset password");
    } finally {
      setSubmitting(false);
    }
  };

  const strength = view === "register" && password ? getPasswordStrength(password) : null;

  // Forgot password success
  if (view === "forgot-success") {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-4xl mb-4">&#9993;</div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Check your email</h1>
          <p className="text-sm text-text-secondary mb-6">
            If an account exists for <span className="font-medium">{email}</span>, you will receive a password reset link.
          </p>
          <button
            onClick={() => setView("login")}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  // Reset password view
  if (view === "reset") {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-primary">Reset password</h1>
            <p className="mt-2 text-sm text-text-secondary">Enter your new password below.</p>
          </div>
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">{success}</div>
          )}
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="reset-password" className="block text-sm font-medium text-text-secondary mb-1">
                New Password <span className="text-text-tertiary font-normal ml-1">(min 8 characters)</span>
              </label>
              <input
                id="reset-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
                autoComplete="new-password"
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
              />
            </div>
            <div>
              <label htmlFor="reset-confirm" className="block text-sm font-medium text-text-secondary mb-1">Confirm Password</label>
              <input
                id="reset-confirm"
                type="password"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700 transition-colors font-medium text-sm disabled:opacity-50"
            >
              {submitting ? "Resetting..." : "Reset password"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Forgot password request
  if (view === "forgot") {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-primary">Forgot password?</h1>
            <p className="mt-2 text-sm text-text-secondary">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
          )}
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-text-secondary mb-1">Email</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700 transition-colors font-medium text-sm disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Send reset link"}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button onClick={() => { setView("login"); setError(""); }} className="text-sm text-primary-600 hover:text-primary-700">
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Login / Register
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">
            {view === "register" ? "Create account" : "Sign in"}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {view === "register"
              ? "Create your OpenPress admin account"
              : "Sign in to your OpenPress dashboard"}
          </p>
        </div>
        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {view === "register" && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Admin"
                required
                minLength={2}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete={view === "register" ? "email" : "username"}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">
              Password
              {view === "register" && <span className="text-text-tertiary font-normal ml-1">(min 8 characters)</span>}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={view === "register" ? "new-password" : "current-password"}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
            />
            {strength && (
              <p className={`mt-1 text-xs ${strength.color}`}>{strength.label}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700 transition-colors font-medium text-sm disabled:opacity-50"
          >
            {isLoading ? "Please wait..." : view === "register" ? "Create account" : "Sign in"}
          </button>
        </form>
        <div className="mt-4 text-center space-y-1">
          {view === "login" && (
            <button
              type="button"
              onClick={() => { setView("forgot"); setError(""); }}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Forgot password?
            </button>
          )}
          <button
            type="button"
            onClick={() => { setView(view === "register" ? "login" : "register"); setError(""); }}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            {view === "register" ? "Already have an account? Sign in" : "Need an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
