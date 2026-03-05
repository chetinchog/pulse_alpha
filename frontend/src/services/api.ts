import axios from 'axios';
import { auth } from '../firebase';
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

// Request interceptor: attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 418 (user not enabled) globally
// The actual UI reaction is handled by the onBlockedCallback registered below
let onBlockedCallback: (() => void) | null = null;

export function registerBlockedCallback(cb: () => void) {
  onBlockedCallback = cb;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 418) {
      onBlockedCallback?.();
    }
    return Promise.reject(error);
  }
);

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

  exportTransactions: async (ticker?: string): Promise<void> => {
    const url_path = ticker ? `/transactions/export?ticker=${ticker}` : '/transactions/export';
    const response = await api.get(url_path, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', ticker ? `transactions_${ticker}.csv` : 'transactions.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // Realized P&L endpoints
  getRealizedPL: async (): Promise<RealizedPL[]> => {
    const response = await api.get<RealizedPL[]>('/realized-pl');
    return response.data;
  },

  exportRealizedPL: async (ticker?: string): Promise<void> => {
    const url_path = ticker ? `/realized-pl/export?ticker=${ticker}` : '/realized-pl/export';
    const response = await api.get(url_path, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', ticker ? `realized_pl_${ticker}.csv` : 'realized_pl.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
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

  // Legacy delete endpoint
  deletePosition: async (id: string): Promise<void> => {
    await api.delete(`/positions/${id}`);
  },
};
