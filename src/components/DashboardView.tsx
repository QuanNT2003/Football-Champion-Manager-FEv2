import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../i18n';
import { clubsApi } from '../services/clubs.service';
import { Club, DashboardData } from '../types';
import { ClubHero } from './dashboard/ClubHero';
import { ClubMetrics } from './dashboard/ClubMetrics';
import { CompetitionBoard } from './dashboard/CompetitionBoard';
import { MatchdayCard } from './dashboard/MatchdayCard';

export function DashboardView({ club, squadCount, onMatchSimulated }: { club: Club; squadCount: number; onMatchSimulated?: () => void | Promise<void> }) {
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState<{
    club: Club;
    data: DashboardData | null;
    failed: boolean;
  } | null>(null);

  useEffect(() => {
    let active = true;
    clubsApi.getDashboard(club.id).then(data => {
      if (active) setSnapshot({ club, data, failed: false });
    }).catch(() => {
      if (active) setSnapshot({ club, data: null, failed: true });
    });
    return () => { active = false; };
  }, [club]);

  const current = snapshot?.club === club ? snapshot : null;
  const data = current?.data;
  const isLoading = current === null;

  return (
    <div className="game-dashboard" aria-busy={isLoading}>
      <ClubHero club={club} data={data?.club} />
      {isLoading && <p className="game-data-status" role="status"><Loader2 className="animate-spin" size={14} /> {t('common.loading')}</p>}
      {current?.failed && <p className="game-data-status" role="status">{t('v2.dashboardError')}</p>}
      <ClubMetrics data={data ?? null} squadCount={squadCount} />
      <div className="game-dashboard-boards">
        <MatchdayCard club={club} next={data?.next_match} last={data?.last_match} onMatchSimulated={async () => { if (onMatchSimulated) await onMatchSimulated(); else setSnapshot({ club, data: await clubsApi.getDashboard(club.id), failed: false }); }} />
        <CompetitionBoard club={club} competitions={data?.competitions ?? []} />
      </div>
    </div>
  );
}


