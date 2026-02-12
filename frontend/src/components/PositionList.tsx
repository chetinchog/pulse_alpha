import { useState, useMemo } from 'react'
import { GroupedPosition } from '../types/portfolio'
import TransactionHistoryModal from './TransactionHistoryModal'

interface Props {
  positions: GroupedPosition[]
  loading: boolean
  onDelete: (id: string) => Promise<void>
  onOpenModal: () => void
}

type SortColumn = 'ticker' | 'quantity' | 'avgPrice' | 'currentPrice' | 'marketValue' | 'profitLoss' | 'return'
type SortDirection = 'asc' | 'desc'

export default function PositionList({ positions, loading, onDelete, onOpenModal }: Props) {
  const [expandedTickers, setExpandedTickers] = useState<Set<string>>(new Set())
  const [sortColumn, setSortColumn] = useState<SortColumn>('ticker')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if clicking same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New column, default to ascending
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

  const toggleExpand = (ticker: string) => {
    const newExpanded = new Set(expandedTickers)
    if (newExpanded.has(ticker)) {
      newExpanded.delete(ticker)
    } else {
      newExpanded.add(ticker)
    }
    setExpandedTickers(newExpanded)
  }

  const handleDelete = async (id: string, ticker: string, date: string) => {
    if (window.confirm(`¿Eliminar la compra de ${ticker} del ${new Date(date).toLocaleDateString()}?`)) {
      try {
        await onDelete(id)
      } catch (error) {
        console.error('Failed to delete position:', error)
        alert('Failed to delete position. Please try again.')
      }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/50 rounded-lg overflow-hidden transition-colors duration-200">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Posiciones por Ticker
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200 shadow-sm hover:shadow-md"
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200 shadow-sm hover:shadow-md"
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
          <p className="text-gray-500 dark:text-gray-400">Loading positions...</p>
        ) : positions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No hay posiciones aún. ¡Haz clic en "Operar" para agregar tu primera operación!
          </p>
        ) : (
        <div className="overflow-x-auto">
          {/* Positions table */}
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">

                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedPositions.map((groupedPos) => {
                const isProfitable = groupedPos.profit_loss >= 0
                const isExpanded = expandedTickers.has(groupedPos.ticker)
                const hasMultiplePositions = groupedPos.individual_positions.length > 1

                return (
                  <>
                    {/* Grouped Row */}
                    <tr key={groupedPos.ticker} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center">
                          {hasMultiplePositions && (
                            <button
                              onClick={() => toggleExpand(groupedPos.ticker)}
                              className="mr-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-150"
                            >
                              <svg
                                className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          )}
                          <span className="font-bold">{groupedPos.ticker}</span>
                          {hasMultiplePositions && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              ({groupedPos.individual_positions.length} compras)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right font-medium">
                        {groupedPos.total_quantity.toFixed(2)}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {!hasMultiplePositions && (
                          <button
                            onClick={() => handleDelete(
                              groupedPos.individual_positions[0].id,
                              groupedPos.ticker,
                              groupedPos.individual_positions[0].created_at
                            )}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors duration-150"
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Detail Rows */}
                    {isExpanded && hasMultiplePositions && groupedPos.individual_positions.map((pos) => {
                      const posIsProfitable = pos.profit_loss >= 0
                      return (
                        <tr key={pos.id} className="bg-gray-50 dark:bg-gray-700/30">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 pl-14">
                            {new Date(pos.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                            {pos.quantity.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                            {formatCurrency(pos.cost_basis)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                            {formatCurrency(pos.current_price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">
                            {formatCurrency(pos.market_value)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${posIsProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(pos.profit_loss)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${posIsProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatPercent(pos.pl_percent)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <button
                              onClick={() => handleDelete(pos.id, pos.ticker, pos.created_at)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 text-xs transition-colors duration-150"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </>
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
    </div>
  )
}
