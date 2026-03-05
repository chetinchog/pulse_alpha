import { useState, useEffect, useMemo } from 'react'
import { Transaction } from '../types/portfolio'
import { portfolioApi } from '../services/api'
import Modal from './Modal'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const ITEMS_PER_PAGE = 20

export default function TransactionHistoryModal({ isOpen, onClose }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (isOpen) {
      fetchTransactions()
    }
  }, [isOpen])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const data = await portfolioApi.getAllTransactions()
      // Sort by executed_at descending (most recent first)
      const sorted = data.sort((a, b) =>
        new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime()
      )
      setTransactions(sorted)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Calculate milestones
  const milestones = useMemo(() => {
    const count = transactions.length
    const achievements = []

    if (count === 1) achievements.push({ type: 'first', label: 'Primera operación' })
    if (count === 10) achievements.push({ type: 'ten', label: '10 operaciones' })
    if (count === 50) achievements.push({ type: 'fifty', label: '50 operaciones' })
    if (count === 100) achievements.push({ type: 'hundred', label: '100 operaciones' })

    return achievements
  }, [transactions.length])

  // Count buy vs sell
  const stats = useMemo(() => {
    const buys = transactions.filter(t => t.operation_type === 'buy').length
    const sells = transactions.filter(t => t.operation_type === 'sell').length
    const totalVolume = transactions.reduce((sum, t) => sum + t.total_amount, 0)

    return { buys, sells, totalVolume }
  }, [transactions])

  // Pagination
  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentTransactions = transactions.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handleExportTransactions = async () => {
    try {
      await portfolioApi.exportTransactions()
    } catch (error) {
      console.error('Failed to export transactions:', error)
    }
  }

  const handleExportRealizedPL = async () => {
    try {
      await portfolioApi.exportRealizedPL()
    } catch (error) {
      console.error('Failed to export realized P&L:', error)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Histórico de Transacciones" disableScroll={true}>
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Cargando tu historia...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 animate-wiggle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-4 text-gray-900 dark:text-white font-medium text-lg">
            Tu historia comienza aquí
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Aún no hay transacciones registradas. Cada operación cuenta tu historia de inversión.
          </p>
        </div>
      ) : (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Stats Summary - Fixed at top */}
          <div className="grid grid-cols-3 gap-4 mb-6 animate-slideUp">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/30 dark:to-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700/50">
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{transactions.length}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700/50">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Compras</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.buys}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/30 dark:to-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700/50">
              <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">Ventas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.sells}</p>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-3 mb-6 animate-slideInLeft">
            <button
              onClick={handleExportTransactions}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all duration-200 hover:shadow-indigo-500/20 active:scale-95 group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar Transacciones (CSV)
            </button>
            <button
              onClick={handleExportRealizedPL}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all duration-200 hover:shadow-blue-500/20 active:scale-95 group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar P&G Realizado (CSV)
            </button>
          </div>

          {/* Milestone Badges - Fixed */}
          {milestones.length > 0 && (
            <div className="mb-6 animate-slideInRight">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Logros:</span>
                {milestones.map(milestone => (
                  <div key={milestone.type} className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium animate-gentleBounce">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {milestone.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions Table and Pagination - Scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ticker
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentTransactions.map((txn, index) => {
                  const isBuy = txn.operation_type === 'buy'
                  const isFirstTransaction = transactions.length === 1 && index === 0

                  return (
                    <tr
                      key={txn.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 ${
                        isFirstTransaction ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          {isFirstTransaction && (
                            <svg className="w-4 h-4 text-yellow-500 animate-sparkle" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          )}
                          {formatDateTime(txn.executed_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {txn.ticker}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium uppercase transition-all duration-200 ${
                            isBuy
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {isBuy ? (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                          )}
                          {isBuy ? 'Compra' : 'Venta'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                        {txn.quantity.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                        {formatCurrency(txn.price)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white text-right">
                        {formatCurrency(txn.total_amount)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Mostrando {startIndex + 1} - {Math.min(endIndex, transactions.length)} de {transactions.length} transacciones
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded transition-all duration-200 ${
                      currentPage === 1
                        ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 button-press'
                    }`}
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded transition-all duration-200 ${
                      currentPage === totalPages
                        ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 button-press'
                    }`}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
