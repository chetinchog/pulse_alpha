import { useState, useMemo } from 'react'
import { GroupedPosition } from '../types/portfolio'
import TransactionHistoryModal from './TransactionHistoryModal'
import TickerHistoryModal from './TickerHistoryModal'
import { Skeleton, SkeletonText } from './SkeletonLoader'

interface Props {
  positions: GroupedPosition[]
  loading: boolean
  onDelete: (id: string) => Promise<void>
  onOpenModal: () => void
  onOpenModalWithTicker: (ticker: string) => void
}

type SortColumn = 'ticker' | 'quantity' | 'avgPrice' | 'currentPrice' | 'marketValue' | 'profitLoss' | 'return'
type SortDirection = 'asc' | 'desc'

export default function PositionList({ positions, loading, onDelete, onOpenModal, onOpenModalWithTicker }: Props) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('ticker')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [selectedTickerForHistory, setSelectedTickerForHistory] = useState<GroupedPosition | null>(null)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const formatQuantity = (value: number) => {
    // Show up to 8 decimal places, remove trailing zeros
    return parseFloat(value.toFixed(8)).toString()
  }

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const sortedPositions = useMemo(() => {
    const sorted = [...positions].sort((a, b) => {
      let aValue: number | string
      let bValue: number | string

      switch (sortColumn) {
        case 'ticker':
          aValue = a.ticker
          bValue = b.ticker
          break
        case 'quantity':
          aValue = a.total_quantity
          bValue = b.total_quantity
          break
        case 'avgPrice':
          aValue = a.weighted_cost_basis
          bValue = b.weighted_cost_basis
          break
        case 'currentPrice':
          aValue = a.current_price
          bValue = b.current_price
          break
        case 'marketValue':
          aValue = a.market_value
          bValue = b.market_value
          break
        case 'profitLoss':
          aValue = a.profit_loss
          bValue = b.profit_loss
          break
        case 'return':
          aValue = a.pl_percent
          bValue = b.pl_percent
          break
        default:
          return 0
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return sortDirection === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number)
      }
    })

    return sorted
  }, [positions, sortColumn, sortDirection])

  // Find best performer (highest P&L percentage)
  const bestPerformer = useMemo(() => {
    if (positions.length === 0) return null
    return positions.reduce((best, current) =>
      current.pl_percent > best.pl_percent ? current : best
    )
  }, [positions])

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }

    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  const handleDelete = async (ticker: string) => {
    if (window.confirm(`¿Eliminar todas las posiciones de ${ticker}?`)) {
      const position = positions.find(p => p.ticker === ticker)
      if (!position) return

      try {
        // Delete all individual positions for this ticker
        for (const pos of position.individual_positions) {
          await onDelete(pos.id)
        }
      } catch (error) {
        console.error('Failed to delete position:', error)
        alert('Failed to delete position. Please try again.')
      }
    }
  }

  const handleOpenTickerHistory = (position: GroupedPosition) => {
    setSelectedTickerForHistory(position)
  }

  const handleAddTransaction = (ticker: string) => {
    onOpenModalWithTicker(ticker)
  }

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
      <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
      <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
      <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
      <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
      <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
      <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
      <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
    </tr>
  )

  return (
    <div className="bg-white dark:bg-gray-800 shadow-soft-lg rounded-lg overflow-hidden transition-all duration-200 border border-gray-100 dark:border-gray-700/50 animate-slideUp animation-delay-200">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Posiciones por Ticker
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 shadow-soft hover:shadow-soft-lg button-press"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Histórico
            </button>
            <button
              onClick={onOpenModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-indigo-800 dark:hover:from-indigo-600 dark:hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 shadow-soft hover:shadow-soft-lg button-press"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Operar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ticker
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cantidad Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Precio Promedio
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Precio Actual
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valor de Mercado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    P&L
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Retorno
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </tbody>
            </table>
          </div>
        ) : positions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 animate-wiggle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="mt-4 text-gray-900 dark:text-white font-medium text-lg">
              Tu portafolio está listo para crecer
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
              Comienza tu camino de inversión haciendo clic en "Operar" para agregar tu primera posición
            </p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors duration-150"
                  onClick={() => handleSort('ticker')}
                >
                  <div className="flex items-center gap-1">
                    Ticker
                    <SortIcon column="ticker" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors duration-150"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Cantidad Total
                    <SortIcon column="quantity" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors duration-150"
                  onClick={() => handleSort('avgPrice')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Precio Promedio
                    <SortIcon column="avgPrice" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors duration-150"
                  onClick={() => handleSort('currentPrice')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Precio Actual
                    <SortIcon column="currentPrice" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors duration-150"
                  onClick={() => handleSort('marketValue')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Valor de Mercado
                    <SortIcon column="marketValue" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors duration-150"
                  onClick={() => handleSort('profitLoss')}
                >
                  <div className="flex items-center justify-end gap-1">
                    P&L
                    <SortIcon column="profitLoss" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors duration-150"
                  onClick={() => handleSort('return')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Retorno
                    <SortIcon column="return" />
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedPositions.map((groupedPos) => {
                const isProfitable = groupedPos.profit_loss >= 0
                const isBestPerformer = bestPerformer?.ticker === groupedPos.ticker && bestPerformer.pl_percent > 0

                return (
                  <tr key={groupedPos.ticker} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        {isBestPerformer && (
                          <svg className="w-5 h-5 mr-2 text-yellow-500 dark:text-yellow-400 animate-sparkle" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        )}
                        <span className="font-bold">{groupedPos.ticker}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right font-medium">
                      {formatQuantity(groupedPos.total_quantity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right font-medium">
                      {formatCurrency(groupedPos.weighted_cost_basis)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                      {formatCurrency(groupedPos.current_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right font-medium">
                      {formatCurrency(groupedPos.market_value)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(groupedPos.profit_loss)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatPercent(groupedPos.pl_percent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center justify-center gap-2">
                        {/* Add transaction button */}
                        <button
                          onClick={() => handleAddTransaction(groupedPos.ticker)}
                          className="p-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-150 hover:scale-110"
                          title="Agregar operación"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>

                        {/* View history button */}
                        <button
                          onClick={() => handleOpenTickerHistory(groupedPos)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-150 hover:scale-110"
                          title="Ver histórico"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(groupedPos.ticker)}
                          className="p-2 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-150 hover:scale-110"
                          title="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Transaction History Modal */}
      <TransactionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      {/* Ticker History Modal */}
      {selectedTickerForHistory && (
        <TickerHistoryModal
          isOpen={selectedTickerForHistory !== null}
          onClose={() => setSelectedTickerForHistory(null)}
          ticker={selectedTickerForHistory.ticker}
          position={selectedTickerForHistory}
        />
      )}
    </div>
  )
}
