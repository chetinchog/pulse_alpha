import { useState, useMemo } from 'react'
import { PortfolioSnapshot } from '../types/portfolio'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { LoadingSpinner } from './SkeletonLoader'

interface Props {
  history: PortfolioSnapshot[]
  loading: boolean
}

type TimeUnit = 'hour' | 'day' | 'month' | 'year'

export default function PortfolioChart({ history, loading }: Props) {
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('day')
  const [quantity, setQuantity] = useState<number>(7)

  // Filter history based on selected time period
  const filteredHistory = useMemo(() => {
    if (history.length === 0) return []

    const now = new Date()
    let cutoffDate: Date

    switch (timeUnit) {
      case 'hour':
        cutoffDate = new Date(now.getTime() - quantity * 60 * 60 * 1000)
        break
      case 'day':
        cutoffDate = new Date(now.getTime() - quantity * 24 * 60 * 60 * 1000)
        break
      case 'month':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - quantity, now.getDate())
        break
      case 'year':
        cutoffDate = new Date(now.getFullYear() - quantity, now.getMonth(), now.getDate())
        break
    }

    return history.filter(snapshot => new Date(snapshot.timestamp) >= cutoffDate)
  }, [history, timeUnit, quantity])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-soft-lg rounded-lg transition-colors duration-200 border border-gray-100 dark:border-gray-700/50 animate-slideUp animation-delay-100">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            Evolución del Portfolio
          </h3>
          <div className="flex items-center justify-center" style={{ height: 300 }}>
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Cargando datos históricos...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-soft-lg rounded-lg transition-colors duration-200 border border-gray-100 dark:border-gray-700/50 animate-slideUp animation-delay-100">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            Evolución del Portfolio
          </h3>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              No hay datos históricos aún. Agrega posiciones para ver la evolución.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Format data for chart
  const chartData = filteredHistory.map((snapshot) => ({
    timestamp: new Date(snapshot.timestamp).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    value: snapshot.total_value,
    cost: snapshot.total_cost,
    profitLoss: snapshot.profit_loss,
  }))

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-soft-lg hover-lift rounded-lg transition-all duration-200 border border-gray-100 dark:border-gray-700/50 animate-slideUp animation-delay-100">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Evolución del Portfolio
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Últimos</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            />
            <select
              value={timeUnit}
              onChange={(e) => setTimeUnit(e.target.value as TimeUnit)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            >
              <option value="hour">Horas</option>
              <option value="day">Días</option>
              <option value="month">Meses</option>
              <option value="year">Años</option>
            </select>
          </div>
        </div>
        <div className="mt-4 animate-fadeIn" style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis
                dataKey="timestamp"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="#9ca3af"
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={formatCurrency}
                stroke="#9ca3af"
              />
              <Tooltip
                formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
                labelStyle={{ color: '#000' }}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                name="Valor de Mercado"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={{ r: 4, fill: '#4f46e5' }}
                activeDot={{ r: 7, stroke: '#4f46e5', strokeWidth: 2, fill: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="cost"
                name="Costo Total"
                stroke="#6b7280"
                strokeWidth={2}
                dot={{ r: 4, fill: '#6b7280' }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 px-4 py-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200/50 dark:border-gray-600/30">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Cada punto representa una operación registrada (compra o venta).
            El gráfico muestra la evolución del valor total del portfolio.
          </p>
        </div>
      </div>
    </div>
  )
}
