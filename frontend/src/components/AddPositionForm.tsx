import { useState, useEffect } from 'react'
import { CreateTransactionRequest, OperationType } from '../types/portfolio'

interface Props {
  onAdd: (data: CreateTransactionRequest, operationType: OperationType) => Promise<void>
}

type InputMode = 'nominal' | 'total'

export default function AddPositionForm({ onAdd }: Props) {
  const [operationType, setOperationType] = useState<OperationType>('buy')
  const [ticker, setTicker] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [datetime, setDatetime] = useState('')
  const [inputMode, setInputMode] = useState<InputMode>('nominal')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Set default datetime to current date/time
  useEffect(() => {
    const now = new Date()
    const formatted = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setDatetime(formatted)
  }, [])

  // Auto-calculate when in nominal mode
  useEffect(() => {
    if (inputMode === 'nominal' && quantity && price) {
      const qty = parseFloat(quantity)
      const prc = parseFloat(price)
      if (!isNaN(qty) && !isNaN(prc) && qty > 0 && prc > 0) {
        setTotalAmount((qty * prc).toFixed(2))
      } else {
        setTotalAmount('')
      }
    }
  }, [quantity, price, inputMode])

  // Auto-calculate when in total mode
  useEffect(() => {
    if (inputMode === 'total' && quantity && totalAmount) {
      const qty = parseFloat(quantity)
      const total = parseFloat(totalAmount)
      if (!isNaN(qty) && !isNaN(total) && qty > 0 && total > 0) {
        setPrice((total / qty).toFixed(2))
      } else {
        setPrice('')
      }
    }
  }, [quantity, totalAmount, inputMode])

  const handleModeChange = (mode: InputMode) => {
    setInputMode(mode)
    // Clear the calculated field when switching modes
    if (mode === 'nominal') {
      setTotalAmount('')
    } else {
      setPrice('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!ticker || !quantity || !price || !datetime) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    const quantityNum = parseFloat(quantity)
    const priceNum = parseFloat(price)

    if (quantityNum <= 0 || priceNum <= 0) {
      alert('La cantidad y el precio deben ser números positivos')
      return
    }

    setIsSubmitting(true)
    try {
      await onAdd(
        {
          ticker: ticker.toUpperCase(),
          quantity: quantityNum,
          price: priceNum,
          executed_at: new Date(datetime).toISOString(),
        },
        operationType
      )

      // Reset form
      setTicker('')
      setQuantity('')
      setPrice('')
      setTotalAmount('')
      setInputMode('nominal')
      setOperationType('buy')
      const now = new Date()
      const formatted = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      setDatetime(formatted)
    } catch (error: any) {
      console.error('Failed to execute transaction:', error)
      const errorMessage = error?.response?.data?.error || error?.message || 'Error al ejecutar la operación. Por favor intenta nuevamente.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Theme colors based on operation type
  const isBuy = operationType === 'buy'
  const tabActiveClass = isBuy
    ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
    : 'border-b-2 border-red-500 text-red-600 dark:text-red-400'
  const tabInactiveClass = 'border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
  const buttonClass = isBuy
    ? 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:ring-indigo-500'
    : 'bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 focus:ring-red-500'

  return (
    <div>
      {/* Operation Type Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setOperationType('buy')}
            className={`py-4 px-1 font-medium text-sm ${
              isBuy ? tabActiveClass : tabInactiveClass
            } transition-colors duration-200`}
          >
            Compra
          </button>
          <button
            onClick={() => setOperationType('sell')}
            className={`py-4 px-1 font-medium text-sm ${
              !isBuy ? tabActiveClass : tabInactiveClass
            } transition-colors duration-200`}
          >
            Venta
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ticker and Quantity */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ticker" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ticker *
            </label>
            <input
              type="text"
              id="ticker"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="AAPL"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border transition-colors duration-200"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Cantidad *
            </label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="10"
              step="0.01"
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border transition-colors duration-200"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Mode Selector */}
        <div className="border-t border-b border-gray-200 dark:border-gray-700 py-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Método de Ingreso
          </label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="inputMode"
                value="nominal"
                checked={inputMode === 'nominal'}
                onChange={() => handleModeChange('nominal')}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                disabled={isSubmitting}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Por Nominal
              </span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="inputMode"
                value="total"
                checked={inputMode === 'total'}
                onChange={() => handleModeChange('total')}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                disabled={isSubmitting}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Por Monto Total
              </span>
            </label>
          </div>
        </div>

        {/* Price and Total Amount */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {isBuy ? 'Precio de Compra ($)' : 'Precio de Venta ($)'} {inputMode === 'nominal' ? '*' : ''}
            </label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="150.00"
              step="0.01"
              min="0"
              disabled={inputMode === 'total' || isSubmitting}
              className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border transition-colors duration-200 ${
                inputMode === 'total'
                  ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            />
            {inputMode === 'total' && price && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Calculado automáticamente
              </p>
            )}
          </div>

          <div>
            <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Monto Total ($) {inputMode === 'total' ? '*' : ''}
            </label>
            <input
              type="number"
              id="totalAmount"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="1500.00"
              step="0.01"
              min="0"
              disabled={inputMode === 'nominal' || isSubmitting}
              className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border transition-colors duration-200 ${
                inputMode === 'nominal'
                  ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            />
            {inputMode === 'nominal' && totalAmount && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Calculado automáticamente
              </p>
            )}
          </div>
        </div>

        {/* DateTime */}
        <div>
          <label htmlFor="datetime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Fecha y Hora *
          </label>
          <input
            type="datetime-local"
            id="datetime"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border transition-colors duration-200"
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full inline-flex justify-center items-center gap-2 rounded-md border border-transparent ${buttonClass} py-2.5 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </>
            ) : (
              isBuy ? 'Ejecutar Compra' : 'Ejecutar Venta'
            )}
          </button>
        </div>

        {/* Helper text */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          * Campos requeridos
        </p>
      </form>
    </div>
  )
}
