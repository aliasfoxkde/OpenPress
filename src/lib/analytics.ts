import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

type AnalyticsProvider = "google" | "plausible" | "custom" | "none";

interface AnalyticsConfig {
  provider: AnalyticsProvider;
  trackingId: string;
  customScript: string;
}

// Singleton state to persist across route changes
let initialized = false;
let lastPath = "";

function loadConfig(): AnalyticsConfig {
  try {
    const raw = localStorage.getItem("openpress-analytics");
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { provider: "none", trackingId: "", customScript: "" };
}

function injectScript(id: string, src: string, attrs?: Record<string, string>) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.src = src;
  script.async = true;
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      script.setAttribute(k, v);
    }
  }
  document.head.appendChild(script);
}

function injectInline(id: string, content: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.textContent = content;
  document.head.appendChild(script);
}

function initGoogleAnalytics(id: string) {
  // gtag.js
  injectInline(
    "gtag-config",
    `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`,
  );
  injectScript("gtag-js", `https://www.googletagmanager.com/gtag/js?id=${id}`);
}

function initPlausible(domain: string) {
  // Plausible script - domain is used as the tracking ID
  const src = `https://plausible.io/js/script.js`;
  injectScript("plausible-js", src, {
    "data-domain": domain,
    defer: "",
  });
}

function initCustom(script: string) {
  injectInline("custom-analytics", script);
}

function trackPageView(path: string, config: AnalyticsConfig) {
  if (config.provider === "google" && config.trackingId) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).gtag?.("event", "page_view", { page_path: path });
    } catch {
      // ignore
    }
  } else if (config.provider === "plausible" && config.trackingId) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).plausible?.("pageview", { u: path });
    } catch {
      // ignore
    }
  }
}

/**
 * Hook to initialize analytics and track page views.
 * Call once in the root layout.
 */
export function useAnalytics() {
  const configRef = useRef<AnalyticsConfig>(loadConfig());
  const routerState = useRouterState();
  const path = routerState.location.pathname;

  // Initialize on mount
  useEffect(() => {
    const config = loadConfig();
    configRef.current = config;

    if (initialized) return;
    initialized = true;

    if (config.provider === "google" && config.trackingId) {
      initGoogleAnalytics(config.trackingId);
    } else if (config.provider === "plausible" && config.trackingId) {
      initPlausible(config.trackingId);
    } else if (config.provider === "custom" && config.customScript) {
      initCustom(config.customScript);
    }
  }, []);

  // Track page views on route changes
  useEffect(() => {
    if (!initialized || !path || path === lastPath) return;
    lastPath = path;
    // Small delay to ensure title/meta are updated
    const timer = setTimeout(() => trackPageView(path, configRef.current), 50);
    return () => clearTimeout(timer);
  }, [path]);

  // Track initial page
  useEffect(() => {
    if (!initialized || !path || lastPath) return;
    lastPath = path;
    const timer = setTimeout(() => trackPageView(path, configRef.current), 50);
    return () => clearTimeout(timer);
  }, [initialized, path]);
}

/**
 * Track a custom event (e.g., button clicks, form submissions).
 */
export function trackEvent(name: string, props?: Record<string, string>) {
  const config = loadConfig();
  if (config.provider === "google" && config.trackingId) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).gtag?.("event", name, props);
    } catch {
      // ignore
    }
  } else if (config.provider === "plausible" && config.trackingId) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).plausible?.(name, { props });
    } catch {
      // ignore
    }
  }
}

/**
 * Call this when analytics settings change to re-initialize.
 */
export function reloadAnalytics(config: AnalyticsConfig) {
  localStorage.setItem("openpress-analytics", JSON.stringify(config));
  initialized = false;
  lastPath = "";
}
