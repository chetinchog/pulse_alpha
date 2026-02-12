import { useState, useEffect } from 'react'
import { portfolioApi } from '../services/api'
import { GroupedPosition, PortfolioSummary as PortfolioSummaryType, PortfolioSnapshot, CreateTransactionRequest, OperationType } from '../types/portfolio'
import PortfolioSummary from './PortfolioSummary'
import PortfolioChart from './PortfolioChart'
import AddPositionForm from './AddPositionForm'
import PositionList from './PositionList'
import Modal from './Modal'

export default function Dashboard() {
  const [positions, setPositions] = useState<GroupedPosition[]>([])
  const [summary, setSummary] = useState<PortfolioSummaryType | null>(null)
  const [history, setHistory] = useState<PortfolioSnapshot[]>([])
  const [loadingPositions, setLoadingPositions] = useState(true)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [initialTicker, setInitialTicker] = useState<string>('')

  const fetchData = async () => {
    try {
      setLoadingPositions(true)
      setLoadingSummary(true)
      setLoadingHistory(true)
      setError(null)

      const [positionsData, summaryData, historyData] = await Promise.all([
        portfolioApi.getGroupedPositions(),
        portfolioApi.getSummary(),
        portfolioApi.getHistory(),
      ])

      setPositions(positionsData)
      setSummary(summaryData)
      setHistory(historyData)
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setError('Failed to load portfolio data. Make sure the backend services are running.')
    } finally {
      setLoadingPositions(false)
      setLoadingSummary(false)
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddPosition = async (data: CreateTransactionRequest, operationType: OperationType) => {
    if (operationType === 'buy') {
      await portfolioApi.createBuyTransaction(data)
    } else {
      await portfolioApi.createSellTransaction(data)
    }
    await fetchData()
    setIsModalOpen(false)
    setInitialTicker('') // Clear initial ticker after adding
  }

  const handleDeletePosition = async (id: string) => {
    await portfolioApi.deletePosition(id)
    await fetchData()
  }

  const handleOpenModal = () => {
    setInitialTicker('')
    setIsModalOpen(true)
  }

  const handleOpenModalWithTicker = (ticker: string) => {
    setInitialTicker(ticker)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setInitialTicker('')
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchData}
          className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PortfolioSummary summary={summary} loading={loadingSummary} />
      <PortfolioChart history={history} loading={loadingHistory} />
      <PositionList
        positions={positions}
        loading={loadingPositions}
        onDelete={handleDeletePosition}
        onOpenModal={handleOpenModal}
        onOpenModalWithTicker={handleOpenModalWithTicker}
      />

      {/* Modal for adding position */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Nueva Operación"
      >
        <AddPositionForm onAdd={handleAddPosition} initialTicker={initialTicker} />
      </Modal>
    </div>
  )
}
