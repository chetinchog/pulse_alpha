import { useState, useEffect } from 'react'
import { CreateTransactionRequest, OperationType } from '../types/portfolio'

interface Props {
  onAdd: (data: CreateTransactionRequest, operationType: OperationType) => Promise<void>
  initialTicker?: string
}

type CalculateField = 'quantity' | 'price' | 'total'

export default function AddPositionForm({ onAdd, initialTicker = '' }: Props) {
  const [operationType, setOperationType] = useState<OperationType>('buy')
  const [ticker, setTicker] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [datetime, setDatetime] = useState('')
  const [calculateField, setCalculateField] = useState<CalculateField>('total')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Set initial ticker if provided
  useEffect(() => {
    if (initialTicker) {
      setTicker(initialTicker)
    }
  }, [initialTicker])

  // Set default datetime to current date/time
  useEffect(() => {
    const now = new Date()
    const formatted = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setDatetime(formatted)
  }, [])

  // Auto-calculate based on selected field
  useEffect(() => {
    const qty = parseFloat(quantity)
    const prc = parseFloat(price)
    const total = parseFloat(totalAmount)

    if (calculateField === 'total') {
      // Calculate Total from Quantity × Price
      if (!isNaN(qty) && !isNaN(prc) && qty > 0 && prc > 0) {
        setTotalAmount((qty * prc).toFixed(2))
      }
    } else if (calculateField === 'quantity') {
      // Calculate Quantity from Total ÷ Price
      if (!isNaN(total) && !isNaN(prc) && total > 0 && prc > 0) {
        setQuantity((total / prc).toFixed(6))
      }
    } else if (calculateField === 'price') {
      // Calculate Price from Total ÷ Quantity
      if (!isNaN(total) && !isNaN(qty) && total > 0 && qty > 0) {
        setPrice((total / qty).toFixed(2))
      }
    }
  }, [quantity, price, totalAmount, calculateField])

  const handleCalculateFieldChange = (field: CalculateField) => {
    setCalculateField(field)
    // Clear the field that will be calculated
    if (field === 'quantity') {
      setQuantity('')
    } else if (field === 'price') {
      setPrice('')
    } else if (field === 'total') {
      setTotalAmount('')
    }
  }

  const getSuccessMessage = (type: OperationType, ticker: string, qty: number) => {
    if (type === 'buy') {
      const messages = [
        `Excelente compra de ${ticker}`,
        `${ticker} agregado a tu portafolio`,
        `Bienvenido ${ticker} al equipo`,
        `${qty.toFixed(4)} ${ticker} asegurados`,
      ]
      return messages[Math.floor(Math.random() * messages.length)]
    } else {
      const messages = [
        `${ticker} vendido con éxito`,
        `Venta de ${ticker} completada`,
        `${ticker} liquidado correctamente`,
        `Hasta pronto ${ticker}`,
      ]
      return messages[Math.floor(Math.random() * messages.length)]
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

      // Show success animation
      setSuccessMessage(getSuccessMessage(operationType, ticker.toUpperCase(), quantityNum))
      setShowSuccess(true)

      // Reset form after short delay
      setTimeout(() => {
        setShowSuccess(false)
        setTicker('')
        setQuantity('')
        setPrice('')
        setTotalAmount('')
        setCalculateField('total')
        setOperationType('buy')
        const now = new Date()
        const formatted = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
        setDatetime(formatted)
      }, 1500)
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

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-successPulse">
        <div className="mb-4">
          <svg className="w-20 h-20 text-green-500 dark:text-green-400 animate-gentleBounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Operación exitosa
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {successMessage}
        </p>
      </div>
    )
  }

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

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Ticker and DateTime Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ticker" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ticker *
            </label>
            <input
              type="text"
              id="ticker"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="AAPL"
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border transition-colors duration-200"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="datetime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha y Hora *
            </label>
            <input
              type="datetime-local"
              id="datetime"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border transition-colors duration-200"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Calculate Field Selector */}
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Campo a calcular automáticamente
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleCalculateFieldChange('quantity')}
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                calculateField === 'quantity'
                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              Cantidad
            </button>
            <button
              type="button"
              onClick={() => handleCalculateFieldChange('price')}
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                calculateField === 'price'
                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              Precio
            </button>
            <button
              type="button"
              onClick={() => handleCalculateFieldChange('total')}
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                calculateField === 'total'
                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              Total
            </button>
          </div>
        </div>

        {/* Calculation Formula with Visual Connectors */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
          <div className="flex items-center justify-center gap-3">
            {/* Quantity Field */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 text-center">
                Cantidad {calculateField !== 'quantity' && '*'}
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="10"
                step="0.0001"
                min="0"
                disabled={calculateField === 'quantity' || isSubmitting}
                className={`block w-full rounded-md shadow-sm sm:text-sm px-3 py-2.5 text-center font-medium transition-all duration-200 ${
                  calculateField === 'quantity'
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 border-2 border-indigo-400 dark:border-indigo-600 text-indigo-900 dark:text-indigo-100 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {calculateField === 'quantity' && (
                <p className="mt-1 text-xs text-center text-indigo-600 dark:text-indigo-400 font-medium">
                  Calculado
                </p>
              )}
            </div>

            {/* Multiply Symbol */}
            <div className="flex flex-col items-center pt-6">
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">×</span>
            </div>

            {/* Price Field */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 text-center">
                Precio ($) {calculateField !== 'price' && '*'}
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="150.00"
                step="0.01"
                min="0"
                disabled={calculateField === 'price' || isSubmitting}
                className={`block w-full rounded-md shadow-sm sm:text-sm px-3 py-2.5 text-center font-medium transition-all duration-200 ${
                  calculateField === 'price'
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 border-2 border-indigo-400 dark:border-indigo-600 text-indigo-900 dark:text-indigo-100 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {calculateField === 'price' && (
                <p className="mt-1 text-xs text-center text-indigo-600 dark:text-indigo-400 font-medium">
                  Calculado
                </p>
              )}
            </div>

            {/* Equals Symbol */}
            <div className="flex flex-col items-center pt-6">
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">=</span>
            </div>

            {/* Total Field */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 text-center">
                Total ($) {calculateField !== 'total' && '*'}
              </label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="1500.00"
                step="0.01"
                min="0"
                disabled={calculateField === 'total' || isSubmitting}
                className={`block w-full rounded-md shadow-sm sm:text-sm px-3 py-2.5 text-center font-medium transition-all duration-200 ${
                  calculateField === 'total'
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 border-2 border-indigo-400 dark:border-indigo-600 text-indigo-900 dark:text-indigo-100 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {calculateField === 'total' && (
                <p className="mt-1 text-xs text-center text-indigo-600 dark:text-indigo-400 font-medium">
                  Calculado
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full inline-flex justify-center items-center gap-2 rounded-md border border-transparent ${buttonClass} py-2.5 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 button-press`}
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
          * Campos requeridos para completar
        </p>
      </form>
    </div>
  )
}
