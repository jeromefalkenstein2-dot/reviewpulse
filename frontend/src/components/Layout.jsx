import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function IconDashboard() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" />
    </svg>
  );
}
function IconBilling() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="16" height="12" rx="1.5" />
      <path d="M2 9h16" />
      <path d="M6 13h2M10 13h4" />
    </svg>
  );
}
function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 6h14M3 10h14M3 14h14" />
    </svg>
  );
}
function IconX() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}

const NAV = [
  { path: '/',         label: 'Dashboard', Icon: IconDashboard },
  { path: '/settings', label: 'Settings',  Icon: IconSettings  },
  { path: '/billing',  label: 'Billing',   Icon: IconBilling   },
];

export default function Layout({ children, shopDomain, headerRight }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const navContent = (
    <>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🌱</div>
        <span className="sidebar-logo-text">ReviewPulse</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ path, label, Icon }) => (
          <button
            key={path}
            className={`sidebar-nav-item${location.pathname === path ? ' active' : ''}`}
            onClick={() => { navigate(path); setOpen(false); }}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-shop-name">{shopDomain || 'myshop.myshopify.com'}</div>
        <div style={{ marginTop: 2, fontSize: 11, color: 'var(--gray-400)' }}>ReviewPulse v1.0</div>
      </div>
    </>
  );

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        {navContent}
      </aside>

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${open ? ' open' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* Main */}
      <div className="main-content">
        <header className="page-header">
          <button className="hamburger" onClick={() => setOpen(o => !o)}>
            {open ? <IconX /> : <IconMenu />}
          </button>
          {headerRight}
        </header>
        <main className="page-body">
          {children}
        </main>
      </div>
    </div>
  );
}
