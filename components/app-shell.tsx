"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./ui";

export const navigation: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/track", label: "Track", icon: "track" },
  { href: "/insights", label: "Insights", icon: "insights" },
  { href: "/ask", label: "Ask", icon: "ask" },
];
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = navigation.find((item) => item.href === pathname);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="PCOS journal home">
          <span className="brand-mark">
            <Icon name="leaf" />
          </span>
          <span>
            PCOS journal<small>Your health, in context</small>
          </span>
        </Link>
        <nav aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-rule" />
          <p>
            A little context today.
            <br />A clearer history over time.
          </p>
          <small>Made for your whole experience.</small>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <span>{active?.label ?? "PCOS journal"}</span>
          <span className="preview-label">Preview workspace</span>
        </header>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="app-footer">
          <span>Your experience is more than a single number.</span>
          <span>A journal for reflection, not diagnosis.</span>
        </footer>
      </div>
    </div>
  );
}
