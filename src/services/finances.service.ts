import { request } from './client';
import { FinancialAccount, LedgerTransaction, ShopItem } from '../types';

export const financesApi = {
  getBalance: (clubId: string) =>
    request<{ clubId: string; cash: number; gold: number }>(`/finances/club/${clubId}/balance`).then(data => ({
      club_id: data.clubId, cash_balance: Number(data.cash), gold_balance: Number(data.gold),
    } satisfies FinancialAccount)),

  getTransactions: (clubId: string) =>
    request<{ id: string; club_id: string; type: string; amount: number; description: string; transaction_date: string }[]>(`/finances/club/${clubId}/transactions`).then(rows => rows.map(row => ({
      id: row.id, club_id: row.club_id, transaction_type: row.type, amount: Number(row.amount),
      description: row.description, created_at: row.transaction_date,
    } satisfies LedgerTransaction))),

  getShop: () => request<ShopItem[]>('/finances/gold-shop'),

  buyShopItem: (data: { club_id: string; item_id: string }) =>
    request(`/finances/club/${data.club_id}/exchange-gold/${data.item_id}`, {
      method: 'POST',
    }),
};
