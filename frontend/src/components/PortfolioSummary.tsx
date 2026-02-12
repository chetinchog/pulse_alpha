import { PortfolioSummary as PortfolioSummaryType } from '../types/portfolio'

interface Props {
  summary: PortfolioSummaryType | null
  loading: boolean
}

export default function PortfolioSummary({ summary, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg dark:shadow-gray-900/50 rounded-lg transition-colors duration-200">
        <div className="px-4 py-5 sm:p-6">
          <p className="text-gray-500 dark:text-gray-400">Loading summary...</p>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg dark:shadow-gray-900/50 rounded-lg transition-colors duration-200">
        <div className="px-4 py-5 sm:p-6">
          <p className="text-gray-500 dark:text-gray-400">No positions yet</p>
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const isUnrealizedProfitable = summary.unrealized_pl >= 0
  const isRealizedProfitable = summary.realized_pl >= 0
  const isTotalProfitable = summary.total_pl >= 0

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg dark:shadow-gray-900/50 rounded-lg transition-colors duration-200">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
          Resumen de Portafolio
        </h3>

        {/* Top Row: Value and Cost */}
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-5">
          <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-colors duration-200">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              Valor Actual
            </dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
              {formatCurrency(summary.total_value)}
            </dd>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Valor de mercado de posiciones abiertas
            </p>
          </div>

          <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-colors duration-200">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              Inversión Abierta
            </dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
              {formatCurrency(summary.total_cost)}
            </dd>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Costo de posiciones abiertas
            </p>
          </div>
        </dl>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

        {/* P&L Breakdown */}
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-colors duration-200">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              P/L No Realizado
            </dt>
            <dd className={`mt-1 text-xl font-semibold ${isUnrealizedProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(summary.unrealized_pl)}
            </dd>
            <p className={`mt-1 text-sm font-medium ${isUnrealizedProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatPercent(summary.unrealized_pl_percent)}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Posiciones abiertas
            </p>
          </div>

          <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-colors duration-200">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              P/L Realizado
            </dt>
            <dd className={`mt-1 text-xl font-semibold ${isRealizedProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(summary.realized_pl)}
            </dd>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Histórico
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Posiciones cerradas
            </p>
          </div>

          <div className="px-4 py-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border-2 border-indigo-200 dark:border-indigo-800 transition-colors duration-200">
            <dt className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate font-bold">
              P/L Total
            </dt>
            <dd className={`mt-1 text-2xl font-bold ${isTotalProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(summary.total_pl)}
            </dd>
            <p className={`mt-1 text-sm font-semibold ${isTotalProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatPercent(summary.total_pl_percent)}
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Realizado + No Realizado
            </p>
          </div>
        </dl>
      </div>
    </div>
  )
}
