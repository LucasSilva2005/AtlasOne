
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Box,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  MapPin,
  Plus,
  Truck,
  Users,
} from 'lucide-react'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import '../App.css'

const performanceData = [
  { day: 'Seg', entregas: 32, pedidos: 40 },
  { day: 'Ter', entregas: 45, pedidos: 52 },
  { day: 'Qua', entregas: 38, pedidos: 48 },
  { day: 'Qui', entregas: 58, pedidos: 65 },
  { day: 'Sex', entregas: 48, pedidos: 58 },
  { day: 'Sáb', entregas: 70, pedidos: 76 },
  { day: 'Dom', entregas: 55, pedidos: 62 },
]

const deliveries = [
  {
    id: '#ATL-1048',
    customer: 'Mariana Oliveira',
    destination: 'São Paulo, SP',
    driver: 'Carlos Mendes',
    status: 'Em rota',
    statusType: 'route',
  },
  {
    id: '#ATL-1047',
    customer: 'Rafael Costa',
    destination: 'Guarulhos, SP',
    driver: 'André Santos',
    status: 'Entregue',
    statusType: 'delivered',
  },
  {
    id: '#ATL-1046',
    customer: 'Fernanda Lima',
    destination: 'Osasco, SP',
    driver: 'Pedro Henrique',
    status: 'Pendente',
    statusType: 'pending',
  },
  {
    id: '#ATL-1045',
    customer: 'Gabriel Souza',
    destination: 'Santo André, SP',
    driver: 'Carlos Mendes',
    status: 'Em rota',
    statusType: 'route',
  },
]

export default function DashboardPage() {
  return (
        <div className="dashboard-content">
          <section className="welcome-section">
            <div>
              <div className="eyebrow">
                <span className="live-dot" />
                PAINEL DE CONTROLE
              </div>
              <h2>Visão geral</h2>
              <p>Acompanhe o desempenho da sua operação logística.</p>
            </div>

            <div className="welcome-actions">
              <button className="secondary-button">
                <CalendarDays size={17} />
                Últimos 7 dias
                <ChevronDown size={15} />
              </button>
              <button className="primary-button">
                <Plus size={18} />
                Novo pedido
              </button>
            </div>
          </section>

          <section className="metrics-grid">
            <MetricCard
              title="Total de pedidos"
              value="1.284"
              change="+12,8%"
              description="em relação à semana anterior"
              icon={<Box size={20} />}
              trend="up"
            />
            <MetricCard
              title="Entregas realizadas"
              value="968"
              change="+8,2%"
              description="em relação à semana anterior"
              icon={<CheckCircle2 size={20} />}
              trend="up"
            />
            <MetricCard
              title="Em andamento"
              value="142"
              change="12,4%"
              description="dos pedidos totais"
              icon={<Truck size={20} />}
              trend="neutral"
            />
            <MetricCard
              title="Motoristas ativos"
              value="24"
              change="+3"
              description="em relação à semana anterior"
              icon={<Users size={20} />}
              trend="up"
            />
          </section>

          <section className="dashboard-grid">
            <div className="panel performance-panel">
              <div className="panel-header">
                <div>
                  <h3>Desempenho da operação</h3>
                  <p>Pedidos e entregas ao longo da semana</p>
                </div>
                <button className="more-button">
                  Esta semana <ChevronDown size={15} />
                </button>
              </div>

              <div className="chart-legend">
                <span><i className="legend-blue" /> Entregas</span>
                <span><i className="legend-muted" /> Pedidos</span>
              </div>

              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="deliveryGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#087bff" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#087bff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#26364c" strokeDasharray="4 4" vertical={false} />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#8290a5', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#8290a5', fontSize: 12 }}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#152238',
                        border: '1px solid #26364c',
                        borderRadius: '10px',
                        color: '#fff',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="pedidos"
                      stroke="#52647d"
                      strokeWidth={2}
                      fill="transparent"
                    />
                    <Area
                      type="monotone"
                      dataKey="entregas"
                      stroke="#087bff"
                      strokeWidth={2.5}
                      fill="url(#deliveryGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel summary-panel">
              <div className="panel-header">
                <div>
                  <h3>Resumo de entregas</h3>
                  <p>Distribuição atual</p>
                </div>
                <button className="icon-button" aria-label="Mais opções">
                  <Activity size={18} />
                </button>
              </div>

              <div className="delivery-total">
                <strong>142</strong>
                <span>entregas em andamento</span>
              </div>

              <div className="progress-list">
                <ProgressItem label="Entregues" value="68%" percentage={68} color="blue" />
                <ProgressItem label="Em rota" value="22%" percentage={22} color="cyan" />
                <ProgressItem label="Pendentes" value="10%" percentage={10} color="muted" />
              </div>

              <div className="summary-footer">
                <div className="summary-footer-icon">
                  <Clock3 size={17} />
                </div>
                <div>
                  <strong>Operação em acompanhamento</strong>
                  <span>Dados demonstrativos</span>
                </div>
              </div>
            </div>
          </section>

          <section className="panel deliveries-panel">
            <div className="panel-header deliveries-heading">
              <div>
                <h3>Entregas recentes</h3>
                <p>Acompanhe as últimas movimentações</p>
              </div>
              <button className="text-button">
                Ver todas <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>IDENTIFICAÇÃO</th>
                    <th>CLIENTE</th>
                    <th>DESTINO</th>
                    <th>MOTORISTA</th>
                    <th>STATUS</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((delivery) => (
                    <tr key={delivery.id}>
                      <td className="delivery-id">{delivery.id}</td>
                      <td>{delivery.customer}</td>
                      <td>
                        <span className="destination">
                          <MapPin size={14} />
                          {delivery.destination}
                        </span>
                      </td>
                      <td>{delivery.driver}</td>
                      <td>
                        <span className={`status status-${delivery.statusType}`}>
                          <i />
                          {delivery.status}
                        </span>
                      </td>
                      <td>
                        <button className="row-action" aria-label={`Ver entrega ${delivery.id}`}>
                          <ArrowDownRight size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>Exibindo 4 registros demonstrativos</span>
              <button className="text-button">Visualizar entregas <ArrowUpRight size={15} /></button>
            </div>
          </section>

          <footer className="dashboard-footer">
            <span>© 2026 AtlasOne. Todos os direitos reservados.</span>
            <span>Plataforma de gestão logística</span>
          </footer>
        </div>
  )
}

function MetricCard({
  title,
  value,
  change,
  description,
  icon,
  trend,
}: {
  title: string
  value: string
  change: string
  description: string
  icon: React.ReactNode
  trend: 'up' | 'neutral'
}) {
  return (
    <div className="panel metric-card">
      <div className="metric-top">
        <span>{title}</span>
        <div className="metric-icon">{icon}</div>
      </div>
      <strong className="metric-value">{value}</strong>
      <div className="metric-bottom">
        <span className={`metric-change ${trend}`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : null}
          {change}
        </span>
        <span>{description}</span>
      </div>
    </div>
  )
}

function ProgressItem({
  label,
  value,
  percentage,
  color,
}: {
  label: string
  value: string
  percentage: number
  color: string
}) {
  return (
    <div className="progress-item">
      <div className="progress-label">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="progress-track">
        <span className={`progress-fill ${color}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
