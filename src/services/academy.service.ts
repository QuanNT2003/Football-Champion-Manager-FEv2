import { request } from './client';
import { Player } from '../types';

export interface AcademyOverview {
  season: { id: string; name: string; number: number };
  academyLevel: number;
  intakeLevel: number | null;
  rules: { level: number; candidateCount: number; eliteProbability: number; minOvr: number; maxOvr: number } | null;
  totalCandidates: number;
  remainingCandidates: number;
  transferOpen: boolean;
  canRecruit: boolean;
  roster: Player[];
}

export interface AcademyCandidate {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  ovr: number;
  potential: number;
  nationality: { id: string; name: string; code: string; flag_url?: string };
  position: { code: string; name: string };
  photo_url?: string;
  weeklyWage: number;
  contractSeasons: number;
}

export const academyApi = {
  overview: (clubId: string, signal?: AbortSignal) =>
    request<AcademyOverview>(`/clubs/${clubId}/academy`, { signal }),
  recruitment: (clubId: string) =>
    request<{ seasonId: string; candidates: AcademyCandidate[] }>(`/clubs/${clubId}/academy/recruitment`, { method: 'POST' }),
  sign: (clubId: string, candidateId: string) =>
    request<{ playerId: string; remainingCandidates: number }>(`/clubs/${clubId}/academy/candidates/${candidateId}/sign`, { method: 'POST' }),
};
