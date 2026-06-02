import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalSuppliers: 0,
    totalRevenue: 0,
    recentOrders: 0,
    lowStockProducts: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const productsRes = await api.get('/api/admin/products', { params: { page: 0, size: 1 } }).catch(() => ({data: {totalElements: 0}}))
      const usersRes = await api.get('/api/admin/users', { params: { page: 0, size: 1 } }).catch(() => ({data: {totalElements: 0}}))
      const suppliersRes = await api.get('/api/suppliers', { params: { page: 0, size: 1 } }).catch(() => ({data: {totalElements: 0}}))
      
      setStats({
        totalProducts: productsRes.data?.totalElements || 0,
        totalUsers: usersRes.data?.totalElements || 0,
        totalSuppliers: suppliersRes.data?.totalElements || 0,
        totalRevenue: 0,
        recentOrders: 0,
        lowStockProducts: 0
      })
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
      setStats({
        totalProducts: 0,
        totalUsers: 0,
        totalSuppliers: 0,
        totalRevenue: 0,
        recentOrders: 0,
        lowStockProducts: 0
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <p className="text-lg text-slate-700 dark:text-slate-300">Carregando dashboard...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-slate-900 dark:text-slate-100">Painel de Administração</h1>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg dark:bg-blue-950/30 dark:border-blue-900">
          <div className="text-sm text-gray-600 mb-2 dark:text-slate-400">Produtos Ativos</div>
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{stats.totalProducts}</div>
          <div className="text-xs text-gray-500 mt-2 dark:text-slate-500">Total no sistema</div>
        </div>

        <div className="bg-green-50 border border-green-200 p-6 rounded-lg dark:bg-green-950/30 dark:border-green-900">
          <div className="text-sm text-gray-600 mb-2 dark:text-slate-400">Usuários</div>
          <div className="text-4xl font-bold text-green-600 dark:text-green-400">{stats.totalUsers}</div>
          <div className="text-xs text-gray-500 mt-2 dark:text-slate-500">Clientes e vendedores</div>
        </div>

        <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg dark:bg-purple-950/30 dark:border-purple-900">
          <div className="text-sm text-gray-600 mb-2 dark:text-slate-400">Fornecedores</div>
          <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">{stats.totalSuppliers}</div>
          <div className="text-xs text-gray-500 mt-2 dark:text-slate-500">Ativos no sistema</div>
        </div>
      </div>

      {/* Mais Estatísticas */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg dark:bg-yellow-950/30 dark:border-yellow-900">
          <div className="text-sm text-gray-600 mb-2 dark:text-slate-400">Receita Total</div>
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">R$ {parseFloat(stats.totalRevenue).toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-2 dark:text-slate-500">De todos os pedidos</div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-lg dark:bg-indigo-950/30 dark:border-indigo-900">
          <div className="text-sm text-gray-600 mb-2 dark:text-slate-400">Pedidos Realizados</div>
          <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{stats.recentOrders}</div>
          <div className="text-xs text-gray-500 mt-2 dark:text-slate-500">Total no sistema</div>
        </div>

        <div className="bg-red-50 border border-red-200 p-6 rounded-lg dark:bg-red-950/30 dark:border-red-900">
          <div className="text-sm text-gray-600 mb-2 dark:text-slate-400">Estoque Baixo</div>
          <div className="text-4xl font-bold text-red-600 dark:text-red-400">{stats.lowStockProducts}</div>
          <div className="text-xs text-gray-500 mt-2 dark:text-slate-500">Produtos com alerta</div>
        </div>
      </div>

      {/* Menu de Gerenciamento */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Gerenciamento</h2>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/admin/products')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">📦</div>
            <div className="font-bold text-lg">Gerenciar Produtos</div>
            <div className="text-sm text-blue-100 mt-2">Criar, editar e deletar produtos</div>
          </button>

          <button
            onClick={() => navigate('/admin/users')}
            className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">👥</div>
            <div className="font-bold text-lg">Gerenciar Usuários</div>
            <div className="text-sm text-green-100 mt-2">Administrar clientes e vendedores</div>
          </button>

          <button
            onClick={() => navigate('/admin/suppliers')}
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">🏪</div>
            <div className="font-bold text-lg">Fornecedores</div>
            <div className="text-sm text-purple-100 mt-2">Gerenciar fornecedores ativos</div>
          </button>

          <button
            onClick={() => navigate('/admin/reports')}
            className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">📊</div>
            <div className="font-bold text-lg">Relatórios</div>
            <div className="text-sm text-yellow-100 mt-2">Vendas, estoque e métricas</div>
          </button>

          <button
            onClick={() => navigate('/admin/reviews')}
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">⭐</div>
            <div className="font-bold text-lg">Avaliações</div>
            <div className="text-sm text-orange-100 mt-2">Moderação de avaliações e críticas</div>
          </button>

          <button
            onClick={() => navigate('/admin/settings')}
            className="bg-gradient-to-br from-gray-500 to-gray-600 text-white p-6 rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">⚙️</div>
            <div className="font-bold text-lg">Configurações</div>
            <div className="text-sm text-gray-100 mt-2">Configurações do sistema</div>
          </button>
        </div>
      </div>

      {/* Atalhos Rápidos */}
      <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg dark:bg-slate-900 dark:border-slate-800">
        <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Atalhos Rápidos</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/admin/products')}
            className="bg-white border border-gray-300 p-3 rounded text-left hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
          >
            <div className="font-semibold text-slate-900 dark:text-slate-100">Verificar Estoque Baixo</div>
            <div className="text-sm text-gray-600 dark:text-slate-400">Produtos que precisam de reposição</div>
          </button>

          <button
            onClick={() => navigate('/admin/reports')}
            className="bg-white border border-gray-300 p-3 rounded text-left hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
          >
            <div className="font-semibold text-slate-900 dark:text-slate-100">Gerar Relatório de Vendas</div>
            <div className="text-sm text-gray-600 dark:text-slate-400">Relatórios e análises</div>
          </button>

          <button
            onClick={() => navigate('/admin/users')}
            className="bg-white border border-gray-300 p-3 rounded text-left hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
          >
            <div className="font-semibold text-slate-900 dark:text-slate-100">Gerenciar Permissões</div>
            <div className="text-sm text-gray-600 dark:text-slate-400">Atribuir roles aos usuários</div>
          </button>

          <button
            onClick={() => window.location.reload()}
            className="bg-white border border-gray-300 p-3 rounded text-left hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
          >
            <div className="font-semibold text-slate-900 dark:text-slate-100">Atualizar Dashboard</div>
            <div className="text-sm text-gray-600 dark:text-slate-400">Recarregar estatísticas</div>
          </button>
        </div>
      </div>
    </div>
  )
}
