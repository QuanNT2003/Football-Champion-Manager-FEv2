import type { TrainingSession } from '../types';

export function trainingSquad(squadType: string): 'FIRST_TEAM' | 'YOUTH' | null {
  if (squadType === 'FIRST_TEAM') return 'FIRST_TEAM';
  if (squadType === 'YOUTH_U19' || squadType === 'YOUTH_U21') return 'YOUTH';
  return null;
}

export type TrainingDrillGroup = 'ATTACK' | 'DEFENSE' | 'PHYSICAL_MENTAL';
export function trainingDrillGroup(category: string): TrainingDrillGroup {
  if (category === 'ATTACKING' || category === 'TECHNICAL') return 'ATTACK';
  if (category === 'DEFENDING' || category === 'GOALKEEPING') return 'DEFENSE';
  return 'PHYSICAL_MENTAL';
}

export const trainingAttributeNames: Record<string, [string, string]> = {
  pac: ['Tốc độ', 'Pace'], acc: ['Tăng tốc', 'Acceleration'], sta: ['Sức bền', 'Stamina'],
  str: ['Sức mạnh', 'Strength'], agi: ['Nhanh nhẹn', 'Agility'], bal: ['Thăng bằng', 'Balance'], jum: ['Bật nhảy', 'Jumping'],
  fin: ['Dứt điểm', 'Finishing'], lsh: ['Sút xa', 'Long shots'], hea: ['Đánh đầu', 'Heading'],
  dri: ['Rê bóng', 'Dribbling'], fir: ['Chạm bước một', 'First touch'], pas: ['Chuyền bóng', 'Passing'],
  cro: ['Tạt bóng', 'Crossing'], tec: ['Kỹ thuật', 'Technique'], tac: ['Tắc bóng', 'Tackling'], mar: ['Kèm người', 'Marking'],
  vis: ['Tầm nhìn', 'Vision'], dec: ['Quyết định', 'Decisions'], cmp: ['Bình tĩnh', 'Composure'],
  pos: ['Chọn vị trí', 'Positioning'], otb: ['Chạy chỗ', 'Off the ball'], wor: ['Chăm chỉ', 'Work rate'],
  gk_ref: ['Phản xạ', 'Reflexes'], gk_han: ['Bắt bóng', 'Handling'], gk_aer: ['Bóng bổng', 'Aerial reach'],
  gk_ooo: ['Đối mặt', 'One on ones'], gk_kic: ['Phát bóng', 'Kicking'],
};

type PlayerDrills = NonNullable<TrainingSession['results']>['players'][number]['drills'];

/** A repeated attribute across the six drills appears once with its total gain. */
export function summarizeTrainingGains(drills: PlayerDrills) {
  const totals = new Map<string, number>();
  for (const drill of drills) {
    for (const gain of drill.gains) {
      const amount = gain.to - gain.from;
      if (amount > 0) totals.set(gain.attribute, (totals.get(gain.attribute) ?? 0) + amount);
    }
  }
  return [...totals].map(([attribute, amount]) => ({ attribute, amount }));
}
