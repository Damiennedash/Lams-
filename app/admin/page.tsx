'use client'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import { formatPrice, formatDate, getCategoryLabel, getStatusLabel } from '@/lib/utils'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

interface Stats {
  overview: {
    totalRevenue: number
    totalOrders: number
    totalCustomers: number
    totalProducts: number
    pendingOrders: number
    monthlyRevenue: number
    weeklyRevenue: number
  }
  dailySales: Array<{ date: string; revenue: number; count: number }>
  categorySales: Array<{ category: string; revenue: number; count: number }>
  topProducts: Array<{ id: string; name: string; sold: number; price: number; revenue: number; stock: number; category: string }>
  lowStockProducts: Array<{ id: string; name: string; stock: number; category: string }>
  recentOrders: Array<{ id: string; total: number; status: string; createdAt: string; user: { name: string } | null; items: any[] }>
}

const catColors: Record<string, string> = {
  VINTAGE: '#C9A96E',
  STOCKS: '#8B7355',
  LAMS_COLLECTION: '#1A1A1A',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-lams-dark/20 border-t-lams-dark rounded-full animate-spin" />
      </div>
    )
  }

  if (!stats) return <div className="p-8 text-lams-gray">Erreur de chargement</div>

  const { overview, dailySales, categorySales, topProducts, lowStockProducts, recentOrders } = stats

  const barData = {
    labels: dailySales.map((d) => {
      const date = new Date(d.date)
      return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'Revenus (FCFA)',
        data: dailySales.map((d) => d.revenue),
        backgroundColor: '#1A1A1A',
        borderColor: '#1A1A1A',
        borderWidth: 1,
        borderRadius: 2,
      },
    ],
  }

  const donutData = {
    labels: categorySales.map((c) => getCategoryLabel(c.category)),
    datasets: [
      {
        data: categorySales.map((c) => c.revenue),
        backgroundColor: categorySales.map((c) => catColors[c.category] || '#888'),
        borderWidth: 0,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.parsed.y.toLocaleString()} FCFA`,
        },
      },
    },
    scales: {
      y: {
        ticks: { callback: (v: any) => v.toLocaleString() + ' F', font: { size: 11 } },
        grid: { color: '#E8E3DB' },
      },
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-lams-dark">Tableau de bord</h1>
          <p className="text-lams-gray text-sm mt-1">Vue d'ensemble de votre boutique</p>
        </div>
        <div className="text-[11px] text-lams-gray tracking-wider">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Revenus totaux', value: formatPrice(overview.totalRevenue), icon: TrendingUp, sub: `Ce mois: ${formatPrice(overview.monthlyRevenue)}` },
          { label: 'Commandes', value: overview.totalOrders, icon: ShoppingBag, sub: `${overview.pendingOrders} en attente`, alert: overview.pendingOrders > 0 },
          { label: 'Clients', value: overview.totalCustomers, icon: Users, sub: 'Comptes actifs' },
          { label: 'Produits', value: overview.totalProducts, icon: Package, sub: `${lowStockProducts.length} stocks faibles`, alert: lowStockProducts.length > 0 },
        ].map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-white p-5 relative overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <p className="text-[11px] tracking-widest text-lams-gray">{kpi.label.toUpperCase()}</p>
                <div className={`w-8 h-8 flex items-center justify-center ${kpi.alert ? 'bg-orange-50' : 'bg-lams-cream'}`}>
                  <Icon size={16} className={kpi.alert ? 'text-orange-500' : 'text-lams-dark'} />
                </div>
              </div>
              <p className="text-2xl font-bold text-lams-dark">{kpi.value}</p>
              <p className="text-[11px] text-lams-gray mt-1">{kpi.sub}</p>
              {kpi.alert && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400" />
              )}
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white p-6">
          <h2 className="text-[11px] tracking-[0.25em] text-lams-gray mb-5">VENTES DES 7 DERNIERS JOURS</h2>
          <Bar data={barData} options={chartOptions as any} />
        </div>

        {/* Donut */}
        <div className="bg-white p-6 flex flex-col">
          <h2 className="text-[11px] tracking-[0.25em] text-lams-gray mb-5">VENTES PAR CATÉGORIE</h2>
          <div className="flex-1 flex items-center justify-center">
            <Doughnut
              data={donutData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } },
                  tooltip: {
                    callbacks: { label: (ctx: any) => `${ctx.raw.toLocaleString()} FCFA` },
                  },
                },
                cutout: '65%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Top products & Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white">
          <div className="px-6 py-4 border-b border-lams-border flex items-center justify-between">
            <h2 className="text-[11px] tracking-[0.25em] text-lams-gray">PRODUITS LES PLUS VENDUS</h2>
          </div>
          <div className="divide-y divide-lams-border">
            {topProducts.length === 0 ? (
              <p className="px-6 py-8 text-sm text-lams-gray text-center">Aucune vente enregistrée</p>
            ) : (
              topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-4 px-6 py-4">
                  <span className="text-2xl font-serif text-lams-lightgray w-6 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-lams-dark truncate">{p.name}</p>
                    <p className="text-[11px] text-lams-gray">{getCategoryLabel(p.category)} · stock: {p.stock}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-lams-dark">{p.sold} vendus</p>
                    <p className="text-[11px] text-lams-gray">{formatPrice(p.revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low stock */}
        <div className="bg-white">
          <div className="px-6 py-4 border-b border-lams-border flex items-center justify-between">
            <h2 className="text-[11px] tracking-[0.25em] text-lams-gray">STOCKS FAIBLES</h2>
            {lowStockProducts.length > 0 && (
              <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                {lowStockProducts.length} alerte{lowStockProducts.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="divide-y divide-lams-border">
            {lowStockProducts.length === 0 ? (
              <p className="px-6 py-8 text-sm text-lams-gray text-center">Tous les stocks sont OK</p>
            ) : (
              lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-6 py-4">
                  <AlertTriangle size={16} className={p.stock === 0 ? 'text-red-500' : 'text-orange-400'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-lams-dark truncate">{p.name}</p>
                    <p className="text-[11px] text-lams-gray">{getCategoryLabel(p.category)}</p>
                  </div>
                  <span className={`text-sm font-bold ${p.stock === 0 ? 'text-red-500' : 'text-orange-500'}`}>
                    {p.stock === 0 ? 'ÉPUISÉ' : `${p.stock} restants`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white">
        <div className="px-6 py-4 border-b border-lams-border flex items-center justify-between">
          <h2 className="text-[11px] tracking-[0.25em] text-lams-gray">COMMANDES RÉCENTES</h2>
          <Link href="/admin/orders" className="text-[11px] tracking-widest text-lams-dark hover:text-lams-brown transition-colors">
            VOIR TOUT →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-lams-border bg-lams-cream/40">
                {['N° COMMANDE', 'CLIENT', 'PRODUITS', 'TOTAL', 'STATUT', 'DATE'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] tracking-widest text-lams-gray font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-lams-border">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-lams-cream/20 transition-colors">
                  <td className="px-5 py-4 font-mono text-sm font-medium text-lams-dark">
                    #{order.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-5 py-4 text-sm text-lams-gray">{order.user?.name || '—'}</td>
                  <td className="px-5 py-4 text-sm text-lams-gray">{order.items.length} article(s)</td>
                  <td className="px-5 py-4 text-sm font-semibold text-lams-dark">{formatPrice(order.total)}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] tracking-widest px-2 py-0.5 ${
                      order.status === 'DELIVERED' ? 'bg-green-50 text-green-700'
                      : order.status === 'SHIPPED' ? 'bg-blue-50 text-blue-700'
                      : order.status === 'CONFIRMED' ? 'bg-lams-cream text-lams-brown'
                      : 'bg-stone-50 text-stone-600'
                    }`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-lams-gray">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentOrders.length === 0 && (
            <p className="px-6 py-8 text-sm text-lams-gray text-center">Aucune commande</p>
          )}
        </div>
      </div>
    </div>
  )
}
