"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Icon, type IconName } from "./ui";
import { PageTransition, MagneticButton, GlobalAmbientFlow } from "./motion";
import "./app-shell.css";

export const navigation: {
  href: string;
  label: string;
  icon: IconName;
  description: string;
}[] = [
  { href: "/", label: "Home", icon: "home", description: "Overview & timeline" },
  { href: "/track", label: "Track", icon: "track", description: "Daily symptoms & logs" },
  { href: "/insights", label: "Insights", icon: "insights", description: "Patterns & visit summary" },
  { href: "/ask", label: "Ask", icon: "ask", description: "Questions for care team" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route changes
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  // Handle ESC key and scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <div className="app-shell">
      <GlobalAmbientFlow />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      {/* Top Navigation Bar */}
      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="brand" aria-label="PHASE home">
            <span className="brand-mark">
              <Icon name="leaf" />
            </span>
            <span className="brand-text">PHASE</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${isActive ? "is-active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Header Action, Auth & Hamburger Button */}
          <div className="header-actions">
            <div className="desktop-auth-controls">
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button type="button" className="auth-btn auth-btn-ghost">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button type="button" className="auth-btn auth-btn-subtle">
                    Sign Up
                  </button>
                </SignUpButton>
              </Show>
            </div>
            <Show when="signed-in">
              <div className="user-button-wrapper">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: {
                        width: "32px",
                        height: "32px",
                      },
                    },
                  }}
                />
              </div>
            </Show>

            <MagneticButton magneticStrength={0.25} innerStrength={0.15}>
              <Link href="/track" className="header-cta-button">
                <Icon name="track" />
                <span>Log Today</span>
              </Link>
            </MagneticButton>

            <button
              type="button"
              className="hamburger-btn"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              <Icon name={mobileMenuOpen ? "close" : "menu"} />
            </button>
          </div>
        </div>

        {/* Mobile Backdrop & Drawer */}
        {mobileMenuOpen && (
          <div
            className="mobile-nav-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
        <div
          id="mobile-nav-drawer"
          className={`mobile-nav-drawer ${mobileMenuOpen ? "is-open" : ""}`}
          aria-hidden={!mobileMenuOpen}
        >
          <div className="mobile-nav-content">
            <nav className="mobile-nav-links" aria-label="Mobile primary navigation">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mobile-nav-item ${isActive ? "is-active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mobile-nav-footer">
              <div className="mobile-auth-wrapper">
                <Show when="signed-out">
                  <div className="mobile-auth-buttons">
                    <SignInButton mode="modal">
                      <button
                        type="button"
                        className="button button-quiet mobile-auth-btn"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button
                        type="button"
                        className="button button-primary mobile-auth-btn"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign Up
                      </button>
                    </SignUpButton>
                  </div>
                </Show>
                <Show when="signed-in">
                  <div className="mobile-user-card">
                    <UserButton showName />
                  </div>
                </Show>
              </div>

              <Link
                href="/track"
                className="button button-primary mobile-cta-btn"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon name="track" />
                <span>Log Today</span>
              </Link>
              <div className="mobile-note">
                <span className="note-rule" />
                <p>
                  A little context today.
                  <br />A clearer history over time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main id="main-content" tabIndex={-1}>
        <PageTransition>{children}</PageTransition>
      </main>

      {/* App Footer */}
      <footer className="app-footer">
        <div className="app-footer-inner">
          <div className="footer-main">
            <div className="footer-brand-col">
              <Link href="/" className="footer-brand" aria-label="PHASE home">
                <span className="brand-mark">
                  <Icon name="leaf" />
                </span>
                <span className="brand-text">
                  PHASE
                  <small>Your health, in context</small>
                </span>
              </Link>
              <p className="footer-tagline">
                A calm space to understand patterns in your symptoms and cycle over time.
              </p>
              <div className="footer-privacy-pill">
                <span>Local browser storage · Stays on your device</span>
              </div>
            </div>

            <div className="footer-nav-col">
              <span className="footer-nav-heading">Navigate</span>
              <nav className="footer-nav-grid" aria-label="Footer navigation">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`footer-nav-card ${isActive ? "is-active" : ""}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span className="footer-nav-icon">
                        <Icon name={item.icon} />
                      </span>
                      <span className="footer-nav-text">
                        <span className="footer-nav-label">{item.label}</span>
                        <span className="footer-nav-desc">{item.description}</span>
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-copy">
              <span>Your experience is more than a single number.</span>
              <span>A private journal for reflection, not diagnosis.</span>
            </div>
            <MagneticButton magneticStrength={0.25} innerStrength={0.12}>
              <button
                type="button"
                className="footer-back-to-top"
                onClick={() => window.scrollTo({ top: 0, behavior: "auto" })}
                aria-label="Scroll back to top of page"
              >
                <span>Back to top</span>
                <Icon name="arrow-up" />
              </button>
            </MagneticButton>
          </div>
        </div>
      </footer>
    </div>
  );
}
