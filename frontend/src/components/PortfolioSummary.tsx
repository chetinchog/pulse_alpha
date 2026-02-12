import { PortfolioSummary as PortfolioSummaryType } from '../types/portfolio'
import { Skeleton, SkeletonText, SkeletonCard } from './SkeletonLoader'

interface Props {
  summary: PortfolioSummaryType | null
  loading: boolean
}

export default function PortfolioSummary({ summary, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-soft-lg rounded-lg transition-colors duration-200 border border-gray-100 dark:border-gray-700/50 animate-slideUp">
        <div className="px-4 py-5 sm:p-6">
          <SkeletonText className="w-48 h-6 mb-6" />

          {/* Top Row Skeleton */}
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-5">
            <SkeletonCard>
              <SkeletonText className="w-24 mb-2" />
              <Skeleton className="h-8 w-32 mb-2" />
              <SkeletonText className="w-40" />
            </SkeletonCard>
            <SkeletonCard>
              <SkeletonText className="w-24 mb-2" />
              <Skeleton className="h-8 w-32 mb-2" />
              <SkeletonText className="w-40" />
            </SkeletonCard>
            <SkeletonCard>
              <SkeletonText className="w-24 mb-2" />
              <Skeleton className="h-8 w-32 mb-2" />
              <SkeletonText className="w-40" />
            </SkeletonCard>
          </dl>

          <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

          {/* P&L Skeleton */}
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <SkeletonCard>
              <SkeletonText className="w-28 mb-2" />
              <Skeleton className="h-7 w-28 mb-2" />
              <SkeletonText className="w-16 mb-2" />
              <SkeletonText className="w-32" />
            </SkeletonCard>
            <SkeletonCard>
              <SkeletonText className="w-28 mb-2" />
              <Skeleton className="h-7 w-28 mb-2" />
              <SkeletonText className="w-24 mb-2" />
              <SkeletonText className="w-32" />
            </SkeletonCard>
            <SkeletonCard>
              <SkeletonText className="w-28 mb-2" />
              <Skeleton className="h-8 w-32 mb-2" />
              <SkeletonText className="w-16 mb-2" />
              <SkeletonText className="w-36" />
            </SkeletonCard>
          </dl>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-soft-lg rounded-lg transition-colors duration-200 border border-gray-100 dark:border-gray-700/50 animate-slideUp">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 animate-wiggle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="mt-4 text-gray-900 dark:text-white font-medium text-lg">Tu portafolio te espera</p>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Haz clic en "Operar" para agregar tu primera estrella</p>
          </div>
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

  // Big win celebration threshold (>10% gain)
  const isBigWin = summary.total_pl_percent > 10

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-soft-lg hover-lift rounded-lg transition-all duration-200 border border-gray-100 dark:border-gray-700/50 animate-slideUp">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Resumen de Portafolio
          </h3>
          {isTotalProfitable && summary.total_pl > 0 && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 animate-slideInRight">
              <svg className="w-5 h-5 animate-sparkle" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-medium">
                {isBigWin ? 'En racha!' : 'Rentable'}
              </span>
            </div>
          )}
        </div>

        {/* Top Row: Value and Cost */}
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-5">
          <div className="px-4 py-5 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-lg transition-all duration-200 border border-gray-200/50 dark:border-gray-600/30 hover:border-indigo-200 dark:hover:border-indigo-500/30 animate-scaleIn">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              Valor Actual
            </dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white number-counter">
              {formatCurrency(summary.total_value)}
            </dd>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Valor de mercado de posiciones abiertas
            </p>
          </div>

          <div className="px-4 py-5 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-lg transition-all duration-200 border border-gray-200/50 dark:border-gray-600/30 hover:border-indigo-200 dark:hover:border-indigo-500/30 animate-scaleIn animation-delay-100">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              Inversión Abierta
            </dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white number-counter">
              {formatCurrency(summary.total_cost)}
            </dd>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Costo de posiciones abiertas
            </p>
          </div>

          <div className="px-4 py-5 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-lg transition-all duration-200 border border-gray-200/50 dark:border-gray-600/30 hover:border-indigo-200 dark:hover:border-indigo-500/30 animate-scaleIn animation-delay-200">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              Inversión Total
            </dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white number-counter">
              {formatCurrency(summary.total_invested)}
            </dd>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Suma de todas las compras
            </p>
          </div>
        </dl>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

        {/* P&L Breakdown */}
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className={`px-4 py-5 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-lg transition-all duration-200 border border-gray-200/50 dark:border-gray-600/30 hover:border-indigo-200 dark:hover:border-indigo-500/30 animate-scaleIn animation-delay-200 ${isUnrealizedProfitable && summary.unrealized_pl > 0 ? 'gradient-profitable' : ''}`}>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              P&L No Realizado
            </dt>
            <dd className={`mt-1 text-xl font-semibold number-counter ${isUnrealizedProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(summary.unrealized_pl)}
            </dd>
            <p className={`mt-1 text-sm font-medium ${isUnrealizedProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatPercent(summary.unrealized_pl_percent)}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Posiciones abiertas
            </p>
          </div>

          <div className={`px-4 py-5 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-lg transition-all duration-200 border border-gray-200/50 dark:border-gray-600/30 hover:border-indigo-200 dark:hover:border-indigo-500/30 animate-scaleIn animation-delay-300 ${isRealizedProfitable && summary.realized_pl > 0 ? 'gradient-profitable' : ''}`}>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              P&L Realizado
            </dt>
            <dd className={`mt-1 text-xl font-semibold number-counter ${isRealizedProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(summary.realized_pl)}
            </dd>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Histórico
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Posiciones cerradas
            </p>
          </div>

          <div className={`px-4 py-5 rounded-lg border-2 transition-all duration-200 animate-scaleIn animation-delay-400 ${
            isTotalProfitable && summary.total_pl > 0
              ? 'bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-900/20 border-green-200 dark:border-green-700/50 hover:border-green-300 dark:hover:border-green-600/50 hover:shadow-success-glow'
              : 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/30 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-700/50 hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:shadow-lg'
          }`}>
            <dt className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate font-bold flex items-center gap-2">
              P&L Total
              {isBigWin && (
                <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full animate-gentleBounce">
                  +10%
                </span>
              )}
            </dt>
            <dd className={`mt-1 text-2xl font-bold number-counter ${isTotalProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
