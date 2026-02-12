import axios from 'axios';
import {
  EnrichedPosition,
  GroupedPosition,
  PortfolioSummary,
  PortfolioSnapshot,
  CreateTransactionRequest,
  Transaction,
  SellTransactionResponse,
  RealizedPL,
} from '../types/portfolio';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const portfolioApi = {
  // Transaction endpoints (new API)
  createBuyTransaction: async (data: CreateTransactionRequest): Promise<Transaction> => {
    const response = await api.post<Transaction>('/transactions/buy', data);
    return response.data;
  },

  createSellTransaction: async (data: CreateTransactionRequest): Promise<SellTransactionResponse> => {
    const response = await api.post<SellTransactionResponse>('/transactions/sell', data);
    return response.data;
  },

  getTransactions: async (): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>('/transactions');
    return response.data;
  },

  getAllTransactions: async (): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>('/transactions');
    return response.data;
  },

  // Realized P&L endpoints
  getRealizedPL: async (): Promise<RealizedPL[]> => {
    const response = await api.get<RealizedPL[]>('/realized-pl');
    return response.data;
  },

  getRealizedPLSummary: async (): Promise<{ total_realized_pl: number; by_ticker: Record<string, number> }> => {
    const response = await api.get<{ total_realized_pl: number; by_ticker: Record<string, number> }>('/realized-pl/summary');
    return response.data;
  },

  // Position endpoints (existing, now derived from transactions)
  getPositions: async (): Promise<EnrichedPosition[]> => {
    const response = await api.get<EnrichedPosition[]>('/positions');
    return response.data;
  },

  getGroupedPositions: async (): Promise<GroupedPosition[]> => {
    const response = await api.get<GroupedPosition[]>('/positions/grouped');
    return response.data;
  },

  // Portfolio endpoints
  getSummary: async (): Promise<PortfolioSummary> => {
    const response = await api.get<PortfolioSummary>('/portfolio/summary');
    return response.data;
  },

  getHistory: async (): Promise<PortfolioSnapshot[]> => {
    const response = await api.get<PortfolioSnapshot[]>('/portfolio/history');
    return response.data;
  },

  // Legacy delete endpoint (will need backend implementation)
  deletePosition: async (id: string): Promise<void> => {
    await api.delete(`/positions/${id}`);
  },
};
