import { useState, useEffect } from 'react'
import Modal from './Modal'
import { Transaction, GroupedPosition } from '../types/portfolio'
import { portfolioApi } from '../services/api'

interface Props {
  isOpen: boolean
  onClose: () => void
  ticker: string
  position: GroupedPosition
}

export default function TickerHistoryModal({ isOpen, onClose, ticker, position }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadTransactions()
    }
  }, [isOpen, ticker])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const allTransactions = await portfolioApi.getTransactions()
      const filtered = allTransactions.filter(t => t.ticker === ticker)
      // Sort by executed_at descending (most recent first)
      filtered.sort((a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime())
      setTransactions(filtered)
    } catch (error) {
      console.error('Failed to load transactions:', error)
    } finally {
      setLoading(false)
    }
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const buyCount = transactions.filter(t => t.operation_type === 'buy').length
  const sellCount = transactions.filter(t => t.operation_type === 'sell').length

  const handleExport = async () => {
    try {
      await portfolioApi.exportTransactions(ticker)
    } catch (error) {
      console.error('Failed to export ticker transactions:', error)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Histórico de ${ticker}`} disableScroll={true}>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Summary Cards - Fixed at top, no scroll */}
        <div className="space-y-3 mb-6">
          {/* Header Row: Row with title-like info and Export Button */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Resumen de Posición
            </h3>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all duration-200 active:scale-95 group"
            >
              <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar CSV
            </button>
          </div>

          {/* First Row: Cantidad, Costo, Valor */}
          <div className="grid grid-cols-3 gap-3">
            <div className="px-4 py-3 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-lg border border-gray-200/50 dark:border-gray-600/30">
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Cantidad Total
              </dt>
              <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                {position.total_quantity.toFixed(8).replace(/\.?0+$/, '')}
              </dd>
            </div>

            <div className="px-4 py-3 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-lg border border-gray-200/50 dark:border-gray-600/30">
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Costo Total
              </dt>
              <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(position.total_cost)}
              </dd>
            </div>

            <div className="px-4 py-3 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-lg border border-gray-200/50 dark:border-gray-600/30">
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Valor de Mercado
              </dt>
              <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(position.market_value)}
              </dd>
            </div>
          </div>

          {/* Second Row: P&L No Realizado, P&L Realizado, P&L Total */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`px-4 py-3 rounded-lg border ${position.profit_loss >= 0 ? 'bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10 border-green-200 dark:border-green-700/50' : 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-900/10 border-red-200 dark:border-red-700/50'}`}>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                P&L No Realizado
              </dt>
              <dd className={`text-lg font-bold ${position.profit_loss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(position.profit_loss)}
              </dd>
              <p className={`text-xs font-semibold ${position.profit_loss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatPercent(position.pl_percent)}
              </p>
            </div>

            <div className={`px-4 py-3 rounded-lg border ${position.realized_pl >= 0 ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-700/50' : 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-900/10 border-red-200 dark:border-red-700/50'}`}>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                P&L Realizado
              </dt>
              <dd className={`text-lg font-bold ${position.realized_pl >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(position.realized_pl)}
              </dd>
            </div>

            <div className={`px-4 py-3 rounded-lg border-2 ${position.total_pl >= 0 ? 'bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-900/20 border-green-300 dark:border-green-700/50' : 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/30 dark:to-red-900/20 border-red-300 dark:border-red-700/50'}`}>
              <dt className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                P&L Total
              </dt>
              <dd className={`text-lg font-bold ${position.total_pl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(position.total_pl)}
              </dd>
              <p className={`text-xs font-semibold ${position.total_pl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatPercent(position.total_pl_percent)}
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Stats - Fixed, no scroll */}
        <div className="flex items-center gap-4 mb-4 px-4 py-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total de operaciones:</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{transactions.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{buyCount} compra{buyCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{sellCount} venta{sellCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Transactions Table - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Cargando transacciones...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No hay transacciones para este ticker</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Precio
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.map((txn) => {
                    const isBuy = txn.operation_type === 'buy'
                    return (
                      <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {formatDateTime(txn.executed_at)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isBuy
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {isBuy ? 'Compra' : 'Venta'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                          {txn.quantity.toFixed(8).replace(/\.?0+$/, '')}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                          {formatCurrency(txn.price)}
                        </td>
                        <td className={`px-4 py-3 text-sm text-right font-semibold ${
                          isBuy ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {isBuy ? '-' : '+'}{formatCurrency(Math.abs(txn.total_amount))}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
