import React from "react";
import { NavLink } from "react-router-dom";

const navigationItems = [
  {
    to: "/admin/users",
    label: "Contributor Applications",
    icon: ApplicationsIcon,
  },
  {
    to: "/reviews",
    label: "资源审核 (Module C)",
    icon: ReviewIcon,
  },
  {
    to: "/admin/categories",
    label: "Category Management",
    icon: CategoryIcon,
  },
  {
    to: "/admin/tags",
    label: "Tag Management",
    icon: TagIcon,
  },
  {
    to: "/admin/resources",
    label: "Resource Admin",
    icon: ResourceIcon,
  },
];

function ApplicationsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={styles.icon} aria-hidden="true">
      <path
        d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 14c-5 0-7 2.5-7 4v1h14v-1c0-1.5-2-4-7-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReviewIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={styles.icon} aria-hidden="true">
      <path
        d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CategoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={styles.icon} aria-hidden="true">
      <path d="M4 7.5 12 4l8 3.5-8 3.5L4 7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4 12l8 3.5 8-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4 16.5 12 20l8-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={styles.icon} aria-hidden="true">
      <path
        d="M11.2 4H6a2 2 0 0 0-2 2v5.2a2 2 0 0 0 .59 1.41l6.8 6.8a2 2 0 0 0 2.82 0l5.02-5.02a2 2 0 0 0 0-2.82l-6.8-6.8A2 2 0 0 0 11.2 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}

function ResourceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={styles.icon} aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function AdminSidebar() {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.brandBlock}>
        <div style={styles.kicker}>Module E</div>
        <h2 style={styles.title}>Module E Admin</h2>
        <p style={styles.subtitle}>System administration workspace for taxonomies and content controls.</p>
      </div>

      <nav style={styles.nav} aria-label="Module E navigation">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive ? styles.linkActive : null),
              })}
            >
              <span style={styles.iconWrap}>
                <Icon />
              </span>
              <span style={styles.linkLabel}>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

const styles = {
  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    width: 260,
    height: "100vh",
    padding: "22px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 24,
    color: "#ecf3ff",
    background: "linear-gradient(180deg, rgba(17, 21, 32, 0.82), rgba(10, 12, 18, 0.72))",
    borderRight: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 18px 48px rgba(0,0,0,0.30)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    zIndex: 40,
  },
  brandBlock: {
    padding: "8px 6px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
  },
  kicker: {
    marginBottom: 8,
    fontSize: 12,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "rgba(236,243,255,0.60)",
  },
  title: {
    margin: 0,
    fontSize: 24,
    lineHeight: 1.1,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: "10px 0 0",
    fontSize: 13,
    lineHeight: 1.55,
    color: "rgba(236,243,255,0.72)",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  link: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "13px 14px",
    borderRadius: 14,
    color: "rgba(236,243,255,0.84)",
    textDecoration: "none",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    transition: "all 180ms ease",
  },
  linkActive: {
    background: "linear-gradient(180deg, rgba(120, 170, 255, 0.22), rgba(85, 125, 255, 0.18))",
    borderColor: "rgba(120, 170, 255, 0.42)",
    boxShadow: "0 12px 28px rgba(45, 110, 255, 0.18)",
    color: "#ffffff",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    flexShrink: 0,
  },
  icon: {
    width: 18,
    height: 18,
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.01em",
  },
};

export default AdminSidebar;
