import { Navigate, Route, Routes } from 'react-router-dom'

import MainLayout from './layouts/MainLayout'
import DashboardPage from './pages/DashboardPage'
import OrdersPage from './pages/OrdersPage'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/pedidos" element={<OrdersPage />} />
        <Route path="/entregas" element={<PlaceholderPage title="Entregas" />} />
        <Route path="/motoristas" element={<PlaceholderPage title="Motoristas" />} />
        <Route path="/rotas" element={<PlaceholderPage title="Rotas" />} />
        <Route path="/configuracoes" element={<PlaceholderPage title="Configurações" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="dashboard-content">
      <section className="welcome-section">
        <div>
          <div className="eyebrow">ATLASONE</div>
          <h2>{title}</h2>
          <p>Esta área está em desenvolvimento.</p>
        </div>
      </section>
    </div>
  )
}

export default App
