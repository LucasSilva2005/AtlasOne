
import { useState } from 'react'
import {
  Activity,
  Bell,
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  MapPin,
  Menu,
  Package,
  Settings,
  Truck,
  Users,
  Wallet,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const navigation = [
  { label: 'Visão geral', path: '/', icon: LayoutDashboard },
  { label: 'Pedidos', path: '/pedidos', icon: Package },
  { label: 'Entregas', path: '/entregas', icon: Truck },
  { label: 'Motoristas', path: '/motoristas', icon: Users },
  { label: 'Rotas', path: '/rotas', icon: MapPin },
]

export default function MainLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="app-layout">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-icon">
            <Activity size={23} strokeWidth={2.5} />
          </div>
          <div>
            <h1>AtlasOne</h1>
            <span>Logística Inteligente</span>
          </div>
        </div>

        <div className="sidebar-section">
          <span className="section-label">MENU PRINCIPAL</span>

          <nav className="navigation">
            {navigation.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'active' : ''}`
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>

                  {item.label === 'Entregas' && (
                    <span className="nav-count">12</span>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div className="sidebar-section settings-section">
          <span className="section-label">PREFERÊNCIAS</span>

          <NavLink
            to="/configuracoes"
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
            onClick={() => setMenuOpen(false)}
          >
            <Settings size={19} />
            <span>Configurações</span>
          </NavLink>

          <a
            href="#"
            className="nav-item"
            onClick={(event) => event.preventDefault()}
          >
            <CircleHelp size={19} />
            <span>Central de ajuda</span>
          </a>
        </div>

        <div className="sidebar-bottom">
          <div className="plan-card">
            <div className="plan-icon">
              <Wallet size={18} />
            </div>
            <strong>AtlasOne Pro</strong>
            <p>Sua operação em um só lugar.</p>
            <div className="plan-progress">
              <span />
            </div>
            <small>Ambiente demonstrativo</small>
          </div>

          <div className="user-profile">
            <div className="avatar">L</div>
            <div className="user-info">
              <strong>Lucas</strong>
              <span>Administrador</span>
            </div>
            <ChevronDown size={17} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu"
              aria-label="Abrir menu"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>AtlasOne</strong>
          </div>

          <div className="topbar-actions">
            <div className="search-box">
              <span>⌕</span>
              <input type="text" placeholder="Buscar..." />
              <kbd>Ctrl K</kbd>
            </div>

            <button
              className="icon-button notification-button"
              aria-label="Notificações"
            >
              <Bell size={19} />
              <span />
            </button>

            <div className="topbar-avatar">L</div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  )
}
