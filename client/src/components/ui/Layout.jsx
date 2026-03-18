import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import AlertToast from './AlertToast';
import './Layout.css';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/transactions', label: 'Transactions', icon: '⇄' },
  { to: '/budgets', label: 'Budgets', icon: '◎' },
  { to: '/portfolio', label: 'Portfolio', icon: '↗' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          Fin<span>Track</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="ws-status">
            <span className={`ws-dot ${connected ? 'connected' : ''}`} />
            {connected ? 'Live' : 'Offline'}
          </div>
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-meta">
              <div className="user-name">{user?.name}</div>
              <button className="btn-logout" onClick={handleLogout}>Sign out</button>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      <AlertToast />
    </div>
  );
}
