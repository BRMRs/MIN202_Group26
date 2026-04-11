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
    label: "Resource Review",
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
  {
    to: "/admin/dashboard",
    label: "Reports",
    icon: DashboardIcon,
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

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={styles.icon} aria-hidden="true">
      <path d="M4 19V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 15v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 15V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 15v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function AdminSidebar() {
  return (
    <aside style={styles.sidebar}>
      {/* Brand block */}
      <div style={styles.brandBlock}>
        <div style={styles.kicker}>Admin Panel</div>
        <h2 style={styles.title}>Heritage Platform</h2>
      </div>

      {/* Navigation */}
      <nav style={styles.nav} aria-label="Admin navigation">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive ? styles.linkActive : {}),
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
    top: 58,
    left: 0,
    width: 260,
    height: "calc(100vh - 58px)",
    padding: "24px 16px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    background: "#ffffff",
    borderRight: "1px solid #e8e3dc",
    boxShadow: "2px 0 8px rgba(0,0,0,0.04)",
    zIndex: 40,
    overflowY: "auto",
  },
  brandBlock: {
    padding: "4px 8px 18px",
    borderBottom: "1px solid #f0ebe2",
  },
  kicker: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#2d6a4f",
    marginBottom: 6,
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    color: "#1a2e1f",
    lineHeight: 1.2,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  link: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderRadius: 10,
    color: "#4b5563",
    textDecoration: "none",
    border: "1px solid transparent",
    transition: "all 140ms ease",
  },
  linkActive: {
    background: "#f0fdf4",
    borderColor: "#bbf7d0",
    color: "#166534",
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f4f6",
    flexShrink: 0,
  },
  icon: {
    width: 16,
    height: 16,
  },
  linkLabel: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.005em",
    lineHeight: 1.3,
  },
};

export default AdminSidebar;
