import { request } from './client';

import type { TrainingType, TrainingOverview, TrainingSession, TrainingSquad } from '../types';
export type { TrainingType, TrainingPlayer, TrainingOverview, TrainingSession, TrainingSquad } from '../types';

export const trainingApi = {
  getTypes: () => request<TrainingType[]>('/training/types'),
  overview: (clubId: string, squadType: TrainingSquad, signal?: AbortSignal) =>
    request<TrainingOverview>(`/training/club/${clubId}/overview?squadType=${squadType}`, { signal }),
  getSessions: (clubId: string, signal?: AbortSignal) =>
    request<TrainingSession[]>(`/training/club/${clubId}/sessions`, { signal }),
  scheduleSession: (clubId: string, trainingTypeIds: string[], playerIds: string[], squadType: TrainingSquad) =>
    request<{ message: string; session: TrainingSession }>(`/training/club/${clubId}/schedule`, {
      method: 'POST', body: JSON.stringify({ trainingTypeIds, playerIds, squadType }),
    }),
};
