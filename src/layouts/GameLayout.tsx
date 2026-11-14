import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Club, Player, TimelineData, User } from '../types';
import { FeatureFrame } from '../components/shell/FeatureFrame';
import { GameTopBar } from '../components/shell/GameTopBar';
import { GameSidebar } from '../components/shell/GameSidebar';
import { useTranslation } from '../i18n';
import { PlayerDetailModal } from '../components/player';

interface Props {
  club: Club;
  user: User;
  timeline: TimelineData | null;
  players: Player[];
  selectedPlayer: Player | null;
  globalNotification: string | null;
  onLogout: () => void;
  loadClubSquad: (clubId: string) => Promise<void> | void;
  setSelectedPlayer: (player: Player | null) => void;
}

export function GameLayout({
  club, user, timeline, players, selectedPlayer, globalNotification, onLogout, loadClubSquad, setSelectedPlayer,
}: Props) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="game-shell">
      <GameSidebar squadCount={players.length} />
      <div className="game-stage">
        <GameTopBar club={club} user={user} timeline={timeline} onLogout={onLogout} />
        <main className="game-main">
          <FeatureFrame>
            <Suspense fallback={<div className="game-route-loading" role="status"><Loader2 className="animate-spin" size={24} /> {t('common.loading')}</div>}>
              <Outlet context={{ setSelectedPlayer }} />
            </Suspense>
          </FeatureFrame>
        </main>
      </div>
      {globalNotification && (
        <div className="game-toast" role="status"><CheckCircle2 size={20} /> {globalNotification}</div>
      )}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          playersList={players}
          currentClubId={club.id}
          onClose={() => setSelectedPlayer(null)}
          onSelectPlayer={setSelectedPlayer}
          onPlayerUpdated={() => loadClubSquad(club.id)}
        />
      )}
    </div>
  );
}


