import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import PageHeader from '../components/PageHeader'
import PageLoadPlaceholder from '../components/PageLoadPlaceholder'

const tiles = [
  { path: '/admin/products', title: 'Produtos', desc: 'Criar, editar e remover itens do catálogo.', accent: 'border-l-brand-600' },
  { path: '/admin/users', title: 'Usuários', desc: 'Gerenciar clientes, vendedores e permissões.', accent: 'border-l-stone-500' },
  { path: '/admin/suppliers', title: 'Fornecedores', desc: 'Cadastro e status dos produtores.', accent: 'border-l-stone-500' },
  { path: '/admin/reports', title: 'Relatórios', desc: 'Vendas, exportações e métricas.', accent: 'border-l-brand-600' },
  { path: '/admin/reviews', title: 'Avaliações', desc: 'Moderação de comentários dos clientes.', accent: 'border-l-stone-500' },
  { path: '/admin/settings', title: 'Configurações', desc: 'Parâmetros gerais da plataforma.', accent: 'border-l-stone-500' },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalSuppliers: 0,
    totalRevenue: 0,
    recentOrders: 0,
    lowStockProducts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const [productsRes, usersRes, suppliersRes] = await Promise.all([
        api.get('/api/admin/products', { params: { page: 0, size: 1 } }).catch(() => ({ data: { totalElements: 0 } })),
        api.get('/api/admin/users', { params: { page: 0, size: 1 } }).catch(() => ({ data: { totalElements: 0 } })),
        api.get('/api/suppliers', { params: { page: 0, size: 1 } }).catch(() => ({ data: { totalElements: 0 } })),
      ])
      setStats({
        totalProducts: productsRes.data?.totalElements || 0,
        totalUsers: usersRes.data?.totalElements || 0,
        totalSuppliers: suppliersRes.data?.totalElements || 0,
        totalRevenue: 0,
        recentOrders: 0,
        lowStockProducts: 0,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <PageLoadPlaceholder />

  return (
    <div className="fade-in max-w-6xl">
      <PageHeader
        title="Administração"
        description="Visão geral e acesso rápido às áreas de gestão."
        action={
          <button type="button" onClick={loadStats} className="btn-secondary">
            Atualizar
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Produtos', value: stats.totalProducts },
          { label: 'Usuários', value: stats.totalUsers },
          { label: 'Fornecedores', value: stats.totalSuppliers },
          { label: 'Receita', value: `R$ ${Number(stats.totalRevenue).toFixed(2)}` },
          { label: 'Pedidos', value: stats.recentOrders },
          { label: 'Estoque baixo', value: stats.lowStockProducts },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="text-xs font-medium text-muted">{s.label}</p>
            <p className="stat-value mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      <h2 className="section-title mt-10 mb-4">Gerenciamento</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <button
            key={t.path}
            type="button"
            onClick={() => navigate(t.path)}
            className={`admin-tile ${t.accent} border-l-4`}
          >
            <p className="font-semibold text-stone-900 dark:text-stone-50">{t.title}</p>
            <p className="mt-1 text-sm text-muted">{t.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}