// Operation types
export type OperationType = 'buy' | 'sell'

// Transaction models
export interface Transaction {
  id: string
  ticker: string
  operation_type: OperationType
  quantity: number
  price: number
  total_amount: number
  executed_at: string
  created_at: string
}

export interface RealizedPL {
  id: string
  ticker: string
  sell_transaction_id: string
  quantity: number
  sell_price: number
  cost_basis: number
  realized_pl: number
  pl_percent: number
  executed_at: string
}

export interface SellTransactionResponse {
  transaction: Transaction
  realized_pl: RealizedPL
}

// Position models (now derived from transactions)
export interface Position {
  ticker: string
  quantity: number
  weighted_cost_basis: number
  total_cost: number
  first_buy_date: string
  last_transaction_date: string
}

export interface EnrichedPosition extends Position {
  current_price: number
  market_value: number
  unrealized_pl: number
  unrealized_pl_percent: number
  realized_pl: number
  total_pl: number
  total_pl_percent: number
}

export interface GroupedPosition {
  ticker: string
  total_quantity: number
  weighted_cost_basis: number
  current_price: number
  market_value: number
  total_cost: number
  profit_loss: number // Unrealized P&L (for backward compat)
  pl_percent: number  // Unrealized P&L % (for backward compat)
  realized_pl: number
  total_pl: number
  total_pl_percent: number
  individual_positions: EnrichedPosition[]
}

export interface PortfolioSummary {
  total_value: number
  total_cost: number
  total_invested: number
  unrealized_pl: number
  unrealized_pl_percent: number
  realized_pl: number
  total_pl: number
  total_pl_percent: number
  position_count: number
}

// Request models
export interface CreateTransactionRequest {
  ticker: string
  quantity: number
  price: number
  executed_at?: string // Optional: ISO 8601 format, defaults to now
}

// Legacy - for backward compatibility
export interface CreatePositionRequest {
  ticker: string
  quantity: number
  cost_basis: number
  created_at?: string
}

export interface PortfolioSnapshot {
  timestamp: string
  total_value: number
  total_cost: number
  profit_loss: number
  event_type: string
  event_ticker: string
}
