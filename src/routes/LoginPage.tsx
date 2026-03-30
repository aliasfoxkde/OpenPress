import { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth";
import { api, ApiError } from "@/lib/api";
import { useSEO } from "@/hooks/useSEO";

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
  useSEO({ title: "Sign In", description: "Sign in to your OpenPress dashboard or create an account", type: "website" });
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const navigate = useNavigate();

  // If URL has ?token= param, auto-switch to reset password view (from email link)
  // If URL has ?redirect= param, store it for post-login navigation
  const [redirectAfter, setRedirectAfter] = useState<string | null>(null);

  const fillDemo = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post<{ data: { user: { id: string; email: string; name: string; role: string }; access_token: string; expires_in: number; csrf_token: string } }>("/auth/demo-login", {});
      localStorage.setItem("auth_token", res.data.access_token);
      localStorage.setItem("auth_user", JSON.stringify(res.data.user));
      localStorage.setItem("csrf_token", res.data.csrf_token);
      useAuthStore.getState().setUser(res.data.user);
      useAuthStore.setState({ token: res.data.access_token, isAuthenticated: true });
      void navigate({ to: redirectAfter || "/admin" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo login failed");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setResetToken(token);
      setView("reset");
    }
    const redirect = params.get("redirect");
    if (redirect) {
      setRedirectAfter(redirect);
    }
  }, []);

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
        void navigate({ to: redirectAfter || "/admin" });
      } else {
        await login(email, password);
        void navigate({ to: redirectAfter || "/admin" });
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
      await api.post("/auth/forgot-password", { email });
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
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token: resetToken, password });
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
      <div className="flex h-full items-center justify-center px-4 bg-surface-secondary">
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
      <div className="flex h-full items-center justify-center px-4 bg-surface-secondary">
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
      <div className="flex h-full items-center justify-center px-4 bg-surface-secondary">
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
    <div className="flex h-full items-center justify-center px-4 bg-surface-secondary">
      <div className="w-full max-w-md">
        <div className="border border-border rounded-2xl bg-surface shadow-xl shadow-black/5 p-6">
          {/* Logo */}
          <div className="text-center mb-4">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <svg viewBox="0 0 32 32" className="w-8 h-8 text-primary-600" fill="none">
                <rect x="2" y="2" width="28" height="28" rx="6" fill="currentColor" opacity="0.1" />
                <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="2" />
                <path d="M10 10h12v2H10z" fill="currentColor" opacity="0.3" />
                <path d="M10 15h8v2H10z" fill="currentColor" opacity="0.25" />
                <path d="M10 20h10v2H10z" fill="currentColor" opacity="0.2" />
                <circle cx="23" cy="20" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M23 18v4M21 20h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="font-bold text-text-primary text-lg group-hover:text-primary-600 transition-colors">OpenPress</span>
            </Link>
          </div>

          <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-text-primary">
              {view === "register" ? "Create account" : "Sign in"}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              {view === "register"
                ? "Create your OpenPress admin account"
                : "Sign in to your OpenPress dashboard"}
            </p>
          </div>
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-3">
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
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 transition-colors"
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
                placeholder="you@example.com"
                required
                autoComplete={view === "register" ? "email" : "username"}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 transition-colors"
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
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 transition-colors"
              />
              {strength && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className={`h-1 flex-1 rounded-full ${strength.color === "text-red-500" ? "bg-red-500" : strength.color === "text-yellow-500" ? "bg-yellow-500" : "bg-green-500"}`} style={{ opacity: strength.label === "Weak" ? 0.3 : strength.label === "Fair" ? 0.6 : strength.label === "Good" ? 0.8 : 1, transition: "opacity 0.3s" }} />
                  <span className={`text-xs ${strength.color}`}>{strength.label}</span>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors font-medium text-sm disabled:opacity-50 shadow-sm"
            >
              {isLoading ? "Please wait..." : view === "register" ? "Create account" : "Sign in"}
            </button>
          </form>
          <div className="mt-4 pt-4 border-t border-border text-center space-y-1">
            {view === "login" && (
              <>
                <button
                  type="button"
                  onClick={fillDemo}
                  disabled={submitting}
                  className="block w-full text-sm text-text-tertiary hover:text-text-secondary py-1.5 px-3 rounded-lg hover:bg-surface-secondary transition-colors disabled:opacity-50"
                >
                  {submitting ? "Logging in..." : "Use demo account"}
                </button>
                <button
                  type="button"
                  onClick={() => { setView("forgot"); setError(""); }}
                  className="block w-full text-sm text-primary-600 hover:text-primary-700"
                >
                  Forgot password?
                </button>
              </>
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
    </div>
  );
}
