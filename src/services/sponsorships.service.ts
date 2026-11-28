import { request } from './client';

export interface Sponsorship {
  id: string;
  sponsor_id: string;
  name: string;
  industry: string;
  description: string | null;
  logo_url: string | null;
  amount: number;
  status: string;
  start_date: string;
  end_date: string | null;
}

export interface SponsorshipSummary {
  season_id: string;
  season_name: string;
  season_number?: number;
  reputation: number;
  finance_level: number;
  max_contracts: number;
  signed_count: number;
  available_slots: number;
  total_income: number;
  offers: Sponsorship[];
  contracts: Sponsorship[];
}

export const sponsorshipsApi = {
  get: (clubId: string) => request<SponsorshipSummary>(`/finances/club/${clubId}/sponsorships`),
  open: (clubId: string) => request<SponsorshipSummary>(`/finances/club/${clubId}/sponsorships/offers`, { method: 'POST' }),
  sign: (clubId: string, offerId: string) => request<SponsorshipSummary>(`/finances/club/${clubId}/sponsorships/${offerId}/sign`, { method: 'POST' }),
};
