import { useMemo, useState, type FormEvent } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  UserRound,
  X,
  XCircle,
} from 'lucide-react'

import './OrdersPage.css'


type OrderStatus =
  | 'Recebido'
  | 'Em separação'
  | 'Pronto para envio'
  | 'Cancelado'

type Order = {
  id: number
  code: string
  customer: string
  date: string
  total: number
  status: OrderStatus
  details?: OrderFormData | null
}

type OrderItem = {
  sku: string
  productName: string
  quantity: string
  unitPrice: string
  discount: string
}

type OrderFormData = {
  customer: {
    name: string
    phone: string
    email: string
    document: string
  }
  address: {
    postalCode: string
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
  }
  order: {
    orderNumber: string
    source: string
    shippingCost: string
    discount: string
    notes: string
  }
  items: OrderItem[]
}

type ViaCepResponse = {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

const createEmptyOrderForm = (): OrderFormData => ({
  customer: {
    name: '',
    phone: '',
    email: '',
    document: '',
  },
  address: {
    postalCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  },
  order: {
    orderNumber: '',
    source: 'manual',
    shippingCost: '0',
    discount: '0',
    notes: '',
  },
  items: [
    {
      sku: '',
      productName: '',
      quantity: '1',
      unitPrice: '',
      discount: '0',
    },
  ],
})



const initialOrders: Order[] = [
  { id: 1, code: 'PED-2026-001', customer: 'Mariana Oliveira', date: '2026-11-25', total: 489.90, status: 'Recebido' },
  { id: 2, code: 'PED-2026-002', customer: 'Roberto Santos', date: '2026-11-25', total: 1250.00, status: 'Em separação' },
  { id: 3, code: 'PED-2026-003', customer: 'Camila Ferreira', date: '2026-11-24', total: 320.50, status: 'Pronto para envio' },
  { id: 4, code: 'PED-2026-004', customer: 'André Costa', date: '2026-11-24', total: 879.90, status: 'Recebido' },
  { id: 5, code: 'PED-2026-005', customer: 'Juliana Martins', date: '2026-11-23', total: 215.00, status: 'Cancelado' },
  { id: 6, code: 'PED-2026-006', customer: 'Felipe Almeida', date: '2026-11-23', total: 1640.00, status: 'Em separação' },
  { id: 7, code: 'PED-2026-007', customer: 'Patrícia Lima', date: '2026-11-22', total: 590.00, status: 'Pronto para envio' },
  { id: 8, code: 'PED-2026-008', customer: 'Gabriel Souza', date: '2026-11-22', total: 740.80, status: 'Recebido' },
]

const filters = [
  'Todos',
  'Recebido',
  'Em separação',
  'Pronto para envio',
  'Cancelado',
] as const

type Filter = (typeof filters)[number]

const currency = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

const parseMoney = (value: string): number => {
  const normalized = value.trim().includes(',')
    ? value.trim().replace(/\./g, '').replace(',', '.')
    : value.trim()

  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : 0
}

const formatDate = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')

function StatusBadge({ status }: { status: OrderStatus }) {
  const icons = {
    'Recebido': Clock3,
    'Em separação': Package,
    'Pronto para envio': CheckCircle2,
    'Cancelado': XCircle,
  }

  const Icon = icons[status]

  return (
    <span className={`order-status status-${status.toLowerCase().replaceAll(' ', '-').replace('ç', 'c').replace('ã', 'a')}`}>
      <Icon size={14} />
      {status}
    </span>
  )
}

export default function OrdersPage() {
  const [cepLoading, setCepLoading] = useState(false)
  const [cepMessage, setCepMessage] = useState('')
  const [orders, setOrders] = useState(initialOrders)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<Filter>('Todos')
  const [currentPage, setCurrentPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [editingOrder, setEditingOrder] = useState(false)
  const [orderForm, setOrderForm] = useState<OrderFormData>(
    createEmptyOrderForm,
  )

  function handleItemChange(
    index: number,
    field: keyof OrderItem,
    value: string,
  ) {
    setOrderForm((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item,
      ),
    }))
  }

  function handleAddItem() {
    setOrderForm((previous) => ({
      ...previous,
      items: [
        ...previous.items,
        {
          sku: '',
          productName: '',
          quantity: '1',
          unitPrice: '',
          discount: '0',
        },
      ],
    }))
  }

  function handleRemoveItem(index: number) {
    setOrderForm((previous) => ({
      ...previous,
      items: previous.items.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }))
  }



  function handlePostalCodeChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 8)

    const formatted =
      digits.length > 5
        ? `${digits.slice(0, 5)}-${digits.slice(5)}`
        : digits

    setOrderForm((previous) => ({
      ...previous,
      address: {
        ...previous.address,
        postalCode: formatted,
      },
    }))

    setCepMessage('')
  }

  const subtotal = orderForm.items.reduce((sum, item) => {
    const quantity = Math.max(0, parseMoney(item.quantity))
    const unitPrice = Math.max(0, parseMoney(item.unitPrice))
    const discount = Math.max(0, parseMoney(item.discount))

    const itemTotal = Math.max(
      0,
      quantity * unitPrice - discount,
    )

    return sum + itemTotal
  }, 0)

  const shippingCost = Math.max(
    0,
    parseMoney(orderForm.order.shippingCost),
  )

  const orderDiscount = Math.max(
    0,
    parseMoney(orderForm.order.discount),
  )

  const orderTotal = Math.max(
    0,
    subtotal + shippingCost - orderDiscount,
  )

  async function handlePostalCodeBlur() {
    const postalCode = orderForm.address.postalCode.replace(/\D/g, '')

    if (!postalCode) {
      setCepMessage('')
      return
    }

    if (postalCode.length !== 8) {
      setCepMessage('Digite um CEP válido com 8 números.')
      return
    }

    setCepLoading(true)
    setCepMessage('Consultando CEP...')

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${postalCode}/json/`,
      )

      if (!response.ok) {
        throw new Error('Falha na consulta')
      }

      const data: ViaCepResponse = await response.json()

      if (data.erro) {
        setCepMessage('CEP não encontrado. Confira os números.')
        return
      }

      setOrderForm((previous) => {
        // Não aplica o resultado se o CEP já tiver sido alterado.
        if (previous.address.postalCode.replace(/\D/g, '') !== postalCode) {
          return previous
        }

        return {
          ...previous,
          address: {
            ...previous.address,
            street: data.logradouro || previous.address.street,
            neighborhood: data.bairro || previous.address.neighborhood,
            city: data.localidade || previous.address.city,
            state: data.uf || previous.address.state,
          },
        }
      })

      setCepMessage('Endereço encontrado com sucesso!')
    } catch {
      setCepMessage('Não foi possível consultar o CEP. Tente novamente.')
    } finally {
      setCepLoading(false)
    }
  }

  const pageSize = 5

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase()

    return orders.filter((order) => {
      const matchesSearch =
        order.code.toLowerCase().includes(term) ||
        order.customer.toLowerCase().includes(term)

      const matchesStatus =
        activeFilter === 'Todos' || order.status === activeFilter

      return matchesSearch && matchesStatus
    })
  }, [orders, search, activeFilter])

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize))

  const visibleOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  const totalValue = orders.reduce((sum, order) => sum + order.total, 0)
  const readyCount = orders.filter((order) => order.status === 'Pronto para envio').length
  const processingCount = orders.filter((order) => order.status === 'Em separação').length

  function handleFilterChange(filter: Filter) {
    setActiveFilter(filter)
    setCurrentPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handleEditOrder(order: Order) {
    if (!order.details) {
      return
    }

    setOrderForm({
      customer: { ...order.details.customer },
      address: { ...order.details.address },
      order: { ...order.details.order },
      items: order.details.items.map((item) => ({ ...item })),
    })

    setSelectedOrder(order)
    setEditingOrder(true)
    setCepMessage('')
    setCepLoading(false)
    setModalOpen(true)
  }

  function handleCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const customerName = orderForm.customer.name.trim()

    const hasValidItem = orderForm.items.some((item) => {
      return (
        item.productName.trim() !== '' &&
        parseMoney(item.quantity) > 0 &&
        parseMoney(item.unitPrice) > 0
      )
    })

    if (!customerName || !hasValidItem || orderTotal <= 0) {
      return
    }

    const nextId = Math.max(0, ...orders.map((order) => order.id)) + 1

    const newOrder: Order = {
      id: nextId,
      code: `PED-2026-${String(nextId).padStart(3, '0')}`,
      customer: customerName,
      date: new Date().toISOString().slice(0, 10),
      total: orderTotal,
      status: 'Recebido',
      details: {
        customer: { ...orderForm.customer },
        address: { ...orderForm.address },
        order: { ...orderForm.order },
        items: orderForm.items.map((item) => ({ ...item })),
      },
    }

    setOrders((previous) => [newOrder, ...previous])
    setOrderForm(createEmptyOrderForm())
    setCepMessage('')
    setCepLoading(false)
    setActiveFilter('Todos')
    setSearch('')
    setCurrentPage(1)
    setModalOpen(false)
  }

  function handleSaveOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedOrder) {
      return
    }

    const customerName = orderForm.customer.name.trim()

    const hasValidItem = orderForm.items.some((item) => {
      return (
        item.productName.trim() !== '' &&
        parseMoney(item.quantity) > 0 &&
        parseMoney(item.unitPrice) > 0
      )
    })

    if (!customerName || !hasValidItem || orderTotal <= 0) {
      return
    }

    const updatedOrder: Order = {
      ...selectedOrder,
      customer: customerName,
      total: orderTotal,
      details: {
        customer: { ...orderForm.customer },
        address: { ...orderForm.address },
        order: { ...orderForm.order },
        items: orderForm.items.map((item) => ({ ...item })),
      },
    }

    setOrders((previous) =>
      previous.map((order) =>
        order.id === selectedOrder.id ? updatedOrder : order,
      ),
    )

    setSelectedOrder(updatedOrder)
    setEditingOrder(false)
    setCepMessage('')
    setCepLoading(false)
    setModalOpen(false)
  }

  return (
    <div className="orders-page">
      <div className="orders-heading">
        <div>
          <div className="orders-eyebrow">GESTÃO OPERACIONAL</div>
          <h1>Pedidos</h1>
          <p>Gerencie os pedidos e acompanhe cada etapa da operação.</p>
        </div>

        <button className="new-order-button" onClick={() => setModalOpen(true)}>
          <Plus size={18} />
          Novo pedido
        </button>
      </div>

      <section className="order-metrics">
        <article className="order-metric-card">
          <div className="metric-icon blue"><Package size={20} /></div>
          <div>
            <span>Total de pedidos</span>
            <strong>{orders.length}</strong>
            <small>Pedidos cadastrados</small>
          </div>
        </article>

        <article className="order-metric-card">
          <div className="metric-icon orange"><Clock3 size={20} /></div>
          <div>
            <span>Em separação</span>
            <strong>{processingCount}</strong>
            <small>Em preparação</small>
          </div>
        </article>

        <article className="order-metric-card">
          <div className="metric-icon green"><CheckCircle2 size={20} /></div>
          <div>
            <span>Prontos para envio</span>
            <strong>{readyCount}</strong>
            <small>Aguardando criação de entrega</small>
          </div>
        </article>

        <article className="order-metric-card">
          <div className="metric-icon purple"><CircleDollarSign size={20} /></div>
          <div>
            <span>Valor dos pedidos</span>
            <strong>{currency(totalValue)}</strong>
            <small>Volume cadastrado</small>
          </div>
        </article>
      </section>

      <section className="orders-panel">
        <div className="orders-panel-heading">
          <div>
            <h2>Todos os pedidos</h2>
            <p>Consulte, pesquise e filtre seus pedidos.</p>
          </div>

          <div className="orders-count">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
          </div>
        </div>

        <div className="orders-toolbar">
          <div className="orders-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por código ou cliente..."
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
            />
          </div>

          <div className="filter-label">
            <SlidersHorizontal size={16} />
            Filtrar por status
          </div>
        </div>

        <div className="order-filters">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`order-filter ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => handleFilterChange(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {visibleOrders.map((order) => (
                <tr
                  key={order.id}
                  className="order-row-clickable"
                  onClick={() => {
                    setSelectedOrder(order)
                    setEditingOrder(false)
                  }}
                >
                  <td>
                    <span className="order-code">{order.code}</span>
                  </td>
                  <td>
                    <div className="order-customer">
                      <div className="customer-avatar">
                        <UserRound size={16} />
                      </div>
                      <span>{order.customer}</span>
                    </div>
                  </td>
                  <td>
                    <span className="order-date">
                      <CalendarDays size={15} />
                      {formatDate(order.date)}
                    </span>
                  </td>
                  <td className="order-amount">{currency(order.total)}</td>
                  <td><StatusBadge status={order.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>

          {visibleOrders.length === 0 && (
            <div className="orders-empty">
              <Package size={30} />
              <strong>Nenhum pedido encontrado</strong>
              <span>Tente alterar sua pesquisa ou os filtros.</span>
            </div>
          )}
        </div>

        <div className="orders-pagination">
          <span>
            Página {currentPage} de {totalPages}
          </span>

          <div className="pagination-actions">
            <button
              aria-label="Página anterior"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              <ChevronLeft size={18} />
            </button>

            <button
              aria-label="Próxima página"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {modalOpen && (
        <div className="order-modal-backdrop" onClick={() => setModalOpen(false)}>
          <section
            className="order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-order-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="order-modal-heading">
              <div>
                <span>{editingOrder ? 'EDIÇÃO DE PEDIDO' : 'NOVO REGISTRO'}</span>
                <h2 id="new-order-title">
                  {editingOrder ? 'Editar pedido' : 'Cadastrar pedido'}
                </h2>
                <p>
                  {editingOrder
                    ? 'Altere as informações do pedido e salve as mudanças.'
                    : 'Informe os dados básicos do pedido.'}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                aria-label="Fechar"
                onClick={() => {
                  setModalOpen(false)
                  setEditingOrder(false)
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={editingOrder ? handleSaveOrder : handleCreateOrder}>
              {/* DADOS DO CLIENTE */}
              <section className="form-section">
                <h3 className="form-section-title">Dados do cliente</h3>

                <div className="form-grid">
                  <div className="form-field form-field-full">
                    <label htmlFor="order-customer">Nome completo</label>
                    <input
                      id="order-customer"
                      value={orderForm.customer.name}
                      onChange={(event) =>
                        setOrderForm((previous) => ({
                          ...previous,
                          customer: {
                            ...previous.customer,
                            name: event.target.value,
                          },
                        }))
                      }
                      placeholder="Ex.: Maria Oliveira"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="order-phone">Telefone / WhatsApp</label>
                    <input
                      id="order-phone"
                      type="tel"
                      value={orderForm.customer.phone}
                      onChange={(event) =>
                        setOrderForm((previous) => ({
                          ...previous,
                          customer: {
                            ...previous.customer,
                            phone: event.target.value,
                          },
                        }))
                      }
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="order-document">CPF / CNPJ</label>
                    <input
                      id="order-document"
                      value={orderForm.customer.document}
                      onChange={(event) =>
                        setOrderForm((previous) => ({
                          ...previous,
                          customer: {
                            ...previous.customer,
                            document: event.target.value,
                          },
                        }))
                      }
                      placeholder="Documento do cliente"
                    />
                  </div>

                  <div className="form-field form-field-full">
                    <label htmlFor="order-email">E-mail</label>
                    <input
                      id="order-email"
                      type="email"
                      value={orderForm.customer.email}
                      onChange={(event) =>
                        setOrderForm((previous) => ({
                          ...previous,
                          customer: {
                            ...previous.customer,
                            email: event.target.value,
                          },
                        }))
                      }
                      placeholder="cliente@email.com"
                    />
                  </div>
                </div>
              </section>

              {/* ENDEREÇO DE ENTREGA */}
              <section className="form-section">
                <h3 className="form-section-title">Endereço de entrega</h3>

                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="order-postal-code">CEP</label>
                    <input
                      id="order-postal-code"
                      value={orderForm.address.postalCode}
                      onChange={(event) =>
                        handlePostalCodeChange(event.target.value)
                      }
                      onBlur={handlePostalCodeBlur}
                      placeholder="00000-000"
                      maxLength={9}
                    />

                    {cepMessage && (
                      <small
                        className={`cep-feedback ${cepMessage.includes('sucesso')
                          ? 'cep-success'
                          : cepMessage.includes('Consultando')
                            ? 'cep-loading'
                            : 'cep-error'
                          }`}
                      >
                        {cepLoading && '⏳ '}
                        {cepMessage}
                      </small>
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="order-state">Estado (UF)</label>
                    <input
                      id="order-state"
                      value={orderForm.address.state}
                      onChange={(event) =>
                        setOrderForm((previous) => ({
                          ...previous,
                          address: {
                            ...previous.address,
                            state: event.target.value.toUpperCase(),
                          },
                        }))
                      }
                      placeholder="Ex.: SP"
                      maxLength={2}
                    />
                  </div>

                  <div className="form-field form-field-full">
                    <label htmlFor="order-street">Rua / Avenida</label>
                    <input
                      id="order-street"
                      value={orderForm.address.street}
                      onChange={(event) =>
                        setOrderForm((previous) => ({
                          ...previous,
                          address: {
                            ...previous.address,
                            street: event.target.value,
                          },
                        }))
                      }
                      placeholder="Nome da rua ou avenida"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="order-number">Número</label>
                    <input
                      id="order-number"
                      value={orderForm.address.number}
                      onChange={(event) =>
                        setOrderForm((previous) => ({
                          ...previous,
                          address: {
                            ...previous.address,
                            number: event.target.value,
                          },
                        }))
                      }
                      placeholder="Número"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="order-complement">Complemento</label>
                    <input
                      id="order-complement"
                      value={orderForm.address.complement}
                      onChange={(event) =>
                        setOrderForm((previous) => ({
                          ...previous,
                          address: {
                            ...previous.address,
                            complement: event.target.value,
                          },
                        }))
                      }
                      placeholder="Apto, bloco, sala..."
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="order-neighborhood">Bairro</label>
                    <input
                      id="order-neighborhood"
                      value={orderForm.address.neighborhood}
                      onChange={(event) =>
                        setOrderForm((previous) => ({
                          ...previous,
                          address: {
                            ...previous.address,
                            neighborhood: event.target.value,
                          },
                        }))
                      }
                      placeholder="Bairro"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="order-city">Cidade</label>
                    <input
                      id="order-city"
                      value={orderForm.address.city}
                      onChange={(event) =>
                        setOrderForm((previous) => ({
                          ...previous,
                          address: {
                            ...previous.address,
                            city: event.target.value,
                          },
                        }))
                      }
                      placeholder="Cidade"
                    />
                  </div>
                </div>
              </section>

              {/* PRODUTOS DO PEDIDO */}
              <section className="form-section">
                <h3 className="form-section-title">Produtos do pedido</h3>

                {orderForm.items.map((item, index) => {
                  const itemTotal = Math.max(
                    0,
                    parseMoney(item.quantity) * parseMoney(item.unitPrice) -
                    parseMoney(item.discount),
                  )

                  return (
                    <div className="form-section" key={index}>
                      <div className="form-section-title">
                        Produto {index + 1}
                      </div>

                      <div className="form-grid">
                        <div className="form-field">
                          <label>SKU</label>
                          <input
                            value={item.sku}
                            onChange={(event) =>
                              handleItemChange(index, 'sku', event.target.value)
                            }
                            placeholder="Código do produto"
                          />
                        </div>

                        <div className="form-field">
                          <label>Nome do produto</label>
                          <input
                            value={item.productName}
                            onChange={(event) =>
                              handleItemChange(index, 'productName', event.target.value)
                            }
                            placeholder="Nome do produto"
                          />
                        </div>

                        <div className="form-field">
                          <label>Quantidade</label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(event) =>
                              handleItemChange(index, 'quantity', event.target.value)
                            }
                          />
                        </div>

                        <div className="form-field">
                          <label>Preço unitário (R$)</label>
                          <input
                            value={item.unitPrice}
                            onChange={(event) =>
                              handleItemChange(index, 'unitPrice', event.target.value)
                            }
                            placeholder="Ex.: 150,00"
                            inputMode="decimal"
                          />
                        </div>

                        <div className="form-field">
                          <label>Desconto do produto (R$)</label>
                          <input
                            value={item.discount}
                            onChange={(event) =>
                              handleItemChange(index, 'discount', event.target.value)
                            }
                            placeholder="Ex.: 10,00"
                            inputMode="decimal"
                          />
                        </div>
                      </div>

                      <p>Total do produto: <strong>{currency(itemTotal)}</strong></p>

                      <button
                        type="button"
                        className="cancel-order-button"
                        disabled={orderForm.items.length === 1}
                        onClick={() => handleRemoveItem(index)}
                      >
                        Remover produto
                      </button>
                    </div>
                  )
                })}

                <button
                  type="button"
                  className="new-order-button"
                  onClick={handleAddItem}
                >
                  <Plus size={16} />
                  Adicionar produto
                </button>
              </section>

              {/* VALORES DO PEDIDO */}
              <section className="form-section">
                <h3 className="form-section-title">Frete e descontos</h3>

                <div className="form-grid">
                  <div className="form-field">
                    <label>Frete (R$)</label>
                    <input
                      value={orderForm.order.shippingCost}
                      onChange={(event) =>
                        setOrderForm((previous) => ({
                          ...previous,
                          order: {
                            ...previous.order,
                            shippingCost: event.target.value,
                          },
                        }))
                      }
                      inputMode="decimal"
                    />
                  </div>

                  <div className="form-field">
                    <label>Desconto geral (R$)</label>
                    <input
                      value={orderForm.order.discount}
                      onChange={(event) =>
                        setOrderForm((previous) => ({
                          ...previous,
                          order: {
                            ...previous.order,
                            discount: event.target.value,
                          },
                        }))
                      }
                      inputMode="decimal"
                    />
                  </div>
                </div>

                <div className="order-total-summary">
                  <p>Subtotal dos produtos: <strong>{currency(subtotal)}</strong></p>
                  <p>Frete: <strong>{currency(shippingCost)}</strong></p>
                  <p>Desconto: <strong>- {currency(orderDiscount)}</strong></p>
                  <h3>Total do pedido: {currency(orderTotal)}</h3>
                </div>
              </section>

              <div className="order-modal-note">
                <Clock3 size={16} />
                O pedido será criado com o status Recebido. Nenhuma entrega será criada automaticamente.
              </div>

              <div className="order-modal-actions">
                <button
                  type="button"
                  className="cancel-order-button"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>

                <button type="submit" className="confirm-order-button">
                  {editingOrder ? 'Salvar alterações' : 'Cadastrar pedido'}
                </button>
              </div>
            </form>

          </section>
        </div>
      )}

      {selectedOrder && !modalOpen && (
        <div className="order-detail-backdrop">
          <section className="order-detail-modal">
            <div className="order-detail-header">
              <div>
                <span>DETALHES DO PEDIDO</span>
                <h2>{selectedOrder.code}</h2>
                <p>Confira todas as informações deste pedido.</p>
              </div>

              <button
                type="button"
                className="modal-close"
                aria-label="Fechar detalhes"
                onClick={() => setSelectedOrder(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="order-detail-content">
              <section className="detail-section">
                <h3>Informações gerais</h3>

                <div className="detail-grid">
                  <p><span>Pedido</span><strong>{selectedOrder.code}</strong></p>
                  <p><span>Data</span><strong>{formatDate(selectedOrder.date)}</strong></p>
                  <p><span>Cliente</span><strong>{selectedOrder.customer}</strong></p>
                  <p><span>Valor total</span><strong>{currency(selectedOrder.total)}</strong></p>
                  <p><span>Status</span><strong><StatusBadge status={selectedOrder.status} /></strong></p>
                </div>
              </section>

              {selectedOrder.details ? (
                <>
                  <section className="detail-section">
                    <h3>Contato do cliente</h3>

                    <div className="detail-grid">
                      <p><span>Telefone / WhatsApp</span><strong>{selectedOrder.details.customer.phone || 'Não informado'}</strong></p>
                      <p><span>E-mail</span><strong>{selectedOrder.details.customer.email || 'Não informado'}</strong></p>
                      <p><span>CPF / CNPJ</span><strong>{selectedOrder.details.customer.document || 'Não informado'}</strong></p>
                    </div>
                  </section>

                  <section className="detail-section">
                    <h3>Endereço de entrega</h3>

                    <div className="detail-grid">
                      <p><span>CEP</span><strong>{selectedOrder.details.address.postalCode || 'Não informado'}</strong></p>
                      <p><span>Logradouro</span><strong>{selectedOrder.details.address.street || 'Não informado'}, {selectedOrder.details.address.number || 'S/N'}</strong></p>
                      <p><span>Complemento</span><strong>{selectedOrder.details.address.complement || 'Não informado'}</strong></p>
                      <p><span>Bairro</span><strong>{selectedOrder.details.address.neighborhood || 'Não informado'}</strong></p>
                      <p><span>Cidade / UF</span><strong>{[selectedOrder.details.address.city, selectedOrder.details.address.state].filter(Boolean).join(' / ') || 'Não informado'}</strong></p>
                    </div>
                  </section>

                  <section className="detail-section">
                    <h3>Produtos do pedido</h3>

                    <div className="detail-products">
                      {selectedOrder.details.items.map((item, index) => {
                        const itemTotal = Math.max(
                          0,
                          parseMoney(item.quantity) * parseMoney(item.unitPrice) -
                          parseMoney(item.discount),
                        )

                        return (
                          <div className="detail-product" key={index}>
                            <div>
                              <strong>{item.productName || 'Produto sem nome'}</strong>
                              <span>SKU: {item.sku || 'Não informado'}</span>
                              <span>Quantidade: {item.quantity}</span>
                            </div>

                            <strong>{currency(itemTotal)}</strong>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                </>
              ) : (
                <p className="detail-no-data">
                  Este pedido de demonstração não possui informações detalhadas cadastradas.
                </p>
              )}
            </div>

            <div className="order-detail-actions">
              <button
                type="button"
                className="cancel-order-button"
                onClick={() => setSelectedOrder(null)}
              >
                Fechar
              </button>

              <button
                type="button"
                className="confirm-order-button"
                disabled={!selectedOrder.details}
                onClick={() => handleEditOrder(selectedOrder)}
              >
                Editar pedido
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
