"use client";
// components/ThemeToggle.tsx
// The theme is applied by an inline script in the layout BEFORE first paint, so
// the page never flashes the wrong one. This only handles the click.

import { useSyncExternalStore } from "react";

const KEY = "studysync-theme";
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return document.documentElement.getAttribute("data-theme") ?? "light";
}

function getServerSnapshot() {
  return "light";
}

export function ThemeToggle() {
  // useSyncExternalStore already handles the server/client split: it uses
  // getServerSnapshot while rendering on the server and during hydration, then
  // switches to the real value. No extra "mounted" flag is needed, and adding
  // one meant updating state during render, which React rightly complains about.
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Private browsing can refuse writes; the theme still applies for now.
    }
    for (const l of listeners) l();
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} className="text-muted transition-colors hover:text-ink"
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </button>
  );
}

function Moon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M14 9.5A6 6 0 1 1 6.5 2a4.8 4.8 0 0 0 7.5 7.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Sun() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3.1" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 1v1.6M8 13.4V15M15 8h-1.6M2.6 8H1m11-5l-1.1 1.1M5.1 10.9L4 12m8 0l-1.1-1.1M5.1 5.1L4 4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
