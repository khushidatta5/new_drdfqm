import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BarChart3, Database, GitCompare, FileText } from 'lucide-react';

const Layout = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Database, label: 'Dashboard' },
    { path: '/quality', icon: BarChart3, label: 'Quality Analysis' },
    { path: '/drift', icon: GitCompare, label: 'Drift Detection' },
    { path: '/reports', icon: FileText, label: 'Reports' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        padding: '2rem 1rem',
        position: 'fixed',
        height: '100vh',
        boxShadow: '4px 0 24px rgba(0,0,0,0.12)'
      }}>
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{
            color: '#fff',
            fontSize: '1.5rem',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Database size={28} color="#0ea5e9" />
            DataGuard
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Drift & Quality Monitor
          </p>
        </div>

        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1rem',
                  marginBottom: '0.5rem',
                  color: active ? '#fff' : '#94a3b8',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  background: active ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                  border: active ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid transparent',
                  fontWeight: active ? '600' : '500',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.target.style.background = 'rgba(148, 163, 184, 0.1)';
                    e.target.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#94a3b8';
                  }
                }}
              >
                <Icon size={20} color={active ? '#0ea5e9' : '#94a3b8'} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{
        marginLeft: '260px',
        flex: 1,
        padding: '2rem',
        minHeight: '100vh'
      }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;