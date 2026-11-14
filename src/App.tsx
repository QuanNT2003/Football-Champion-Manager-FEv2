import { useState, useEffect, useCallback, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Club, Player, TimelineData, User } from './types';
import { clubsApi } from './services/clubs.service';
import { playersApi } from './services/players.service';
import { gameWorldApi } from './services/gameWorld.service';
import { authApi } from './services/auth.service';

import { GameLayout } from './layouts/GameLayout';
import { AuthScreen } from './components/AuthScreen';
import { ClubOnboardingScreen } from './components/ClubOnboardingScreen';
import { DashboardView } from './components/DashboardView';
import { Loader2 } from 'lucide-react';
import { useTranslation } from './i18n';

const SquadView = lazy(() => import('./components/SquadView').then(module => ({ default: module.SquadView })));
const TacticsView = lazy(() => import('./components/TacticsView').then(module => ({ default: module.TacticsView })));
const MatchCenterView = lazy(() => import('./components/MatchCenterView').then(module => ({ default: module.MatchCenterView })));
const TransfersView = lazy(() => import('./components/TransfersView').then(module => ({ default: module.TransfersView })));
const ClubTransfersView = lazy(() => import('./components/transfers/ClubTransfersView').then(module => ({ default: module.ClubTransfersView })));
const FacilitiesView = lazy(() => import('./components/FacilitiesView').then(module => ({ default: module.FacilitiesView })));
const FinancesView = lazy(() => import('./components/FinancesView').then(module => ({ default: module.FinancesView })));
const TrainingView = lazy(() => import('./components/TrainingView').then(module => ({ default: module.TrainingView })));
const LeagueView = lazy(() => import('./components/standings/LeagueView').then(module => ({ default: module.LeagueView })));
const KnockoutCupView = lazy(() => import('./components/standings/KnockoutCupView').then(module => ({ default: module.KnockoutCupView })));
const GroupKnockoutView = lazy(() => import('./components/standings/GroupKnockoutView').then(module => ({ default: module.GroupKnockoutView })));
const TrophiesView = lazy(() => import('./components/trophies').then(module => ({ default: module.TrophiesView })));
const ClubStaffView = lazy(() => import('./components/ClubStaffView').then(module => ({ default: module.ClubStaffView })));
const ClubDetailView = lazy(() => import('./components/ClubDetailView').then(module => ({ default: module.ClubDetailView })));

export function App() {
  const { t } = useTranslation();
  const navigate = useNavigate();


  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(() => authApi.getCurrentUser());
  const [club, setClub] = useState<Club | null>(() => authApi.getCurrentClub());
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [globalNotification, setGlobalNotification] = useState<string | null>(null);

  const loadClubSquad = async (clubId: string) => {
    try {
      const squad = await playersApi.getClubSquad(clubId);
      setPlayers(Array.isArray(squad) ? squad : []);
    } catch (err) {
      console.error('Failed to load squad:', err);
    }
  };

  const checkAuthState = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('fc_token');

    if (!token) {
      setUser(null);
      setClub(null);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Verify User Profile
      const profile = await authApi.getProfile().catch(() => null);
      if (!profile) {
        authApi.logout();
        setUser(null);
        setClub(null);
        setIsLoading(false);
        return;
      }
      setUser(profile);
      localStorage.setItem('fc_user', JSON.stringify(profile));

      // 2. Load Timeline
      gameWorldApi.getTimeline('1').then((tl) => {
        if (tl) setTimeline(tl);
      }).catch(() => null);

      // 3. Check if user owns a club
      const myClub = await clubsApi.getMyClub().catch(() => null);
      if (!myClub || !myClub.id) {
        setClub(null);
        localStorage.removeItem('fc_club');
        setIsLoading(false);
        return;
      }

      setClub(myClub);
      localStorage.setItem('fc_club', JSON.stringify(myClub));
      await loadClubSquad(myClub.id);
      setIsLoading(false);
    } catch (err) {
      console.error('Error during auth verification:', err);
      authApi.logout();
      setUser(null);
      setClub(null);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  const handleLogout = () => {
    authApi.logout();
    setUser(null);
    setClub(null);
    setPlayers([]);
    setSelectedPlayer(null);
    setTimeline(null);
    navigate('/login');
  };

  const handleClubClaimed = (newClub: Club) => {
    setClub(newClub);
    localStorage.setItem('fc_club', JSON.stringify(newClub));
    loadClubSquad(newClub.id);
    navigate('/dashboard');
  };

  const refreshClubData = async () => {
    if (!club) return;
    try {
      const updated = await clubsApi.getClubById(club.id);
      setClub(updated);
      localStorage.setItem('fc_club', JSON.stringify(updated));
      loadClubSquad(club.id);
    } catch (err) {
      console.error('Failed to refresh club:', err);
    }
  };

  const handleUpgradeFacility = async (facilityId: string) => {
    if (!club) return;
    try {
      await clubsApi.upgradeFacility(club.id, facilityId);
      setGlobalNotification(t('app.upgrade_success', 'Cơ sở vật chất đã bắt đầu nâng cấp thành công!'));
      refreshClubData();
      setTimeout(() => setGlobalNotification(null), 3500);
    } catch (err: any) {
      alert(err.response?.data?.message || t('app.upgrade_failed', 'Nâng cấp thất bại, kiểm tra số dư'));
    }
  };

  const handleUpdateTransferListing = async (
    playerId: string,
    isTransfer: boolean,
    isLoan: boolean,
    price?: number
  ) => {
    try {
      await playersApi.updateTransferListing(playerId, isTransfer, isLoan, price);
      setGlobalNotification(t('app.market_status_updated', 'Cập nhật trạng thái thị trường chuyển nhượng thành công!'));
      if (club) loadClubSquad(club.id);
      setTimeout(() => setGlobalNotification(null), 3500);
    } catch (err: any) {
      alert(err.response?.data?.message || t('app.market_update_failed', 'Không thể cập nhật danh sách chuyển nhượng'));
    }
  };

  if (isLoading) {
    return (
      <div className="app-loading-screen-hud">
        <div className="loading-card-hud">
          <div className="loading-crest-hex">⚽</div>
          <h2>FOOTBALL CHAMPION MANAGER</h2>
          <div className="loading-spinner-row">
            <Loader2 className="spinner-icon-hud" size={24} />
            <span>{t('app.syncing_data', 'Đang đồng bộ dữ liệu Match Engine & HLV...')}</span>
          </div>
        </div>
      </div>
    );
  }

  const cashBalance = club?.financial_accounts?.[0]?.cash_balance ?? club?.finances?.cash ?? 1500000;

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          user && club ? (
            <Navigate to="/dashboard" replace />
          ) : user && !club ? (
            <Navigate to="/onboarding" replace />
          ) : (
            <AuthScreen onAuthSuccess={checkAuthState} defaultMode="login" />
          )
        }
      />
      <Route
        path="/register"
        element={
          user && club ? (
            <Navigate to="/dashboard" replace />
          ) : user && !club ? (
            <Navigate to="/onboarding" replace />
          ) : (
            <AuthScreen onAuthSuccess={checkAuthState} defaultMode="register" />
          )
        }
      />

      {/* Onboarding Room Route */}
      <Route
        path="/onboarding"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : club ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <ClubOnboardingScreen
              user={user}
              onClubClaimed={handleClubClaimed}
              onLogout={handleLogout}
            />
          )
        }
      />

      {/* Main Game Layout & Nested Routes */}
      <Route
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : !club ? (
            <Navigate to="/onboarding" replace />
          ) : (
            <GameLayout
              club={club}
              user={user}
              timeline={timeline}
              players={players}
              selectedPlayer={selectedPlayer}
              globalNotification={globalNotification}
              onLogout={handleLogout}
              loadClubSquad={loadClubSquad}
              setSelectedPlayer={setSelectedPlayer}
            />
          )
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            club && <DashboardView club={club} squadCount={players.length} />
          }
        />
        <Route
          path="/squad"
          element={
            <SquadView
              onUpdateTransferListing={handleUpdateTransferListing}
              players={players}
              onSelectPlayer={setSelectedPlayer}
              onRefreshSquad={() => club && loadClubSquad(club.id)}
            />
          }
        />
        <Route
          path="/staff"
          element={
            <ClubStaffView
              clubId={club?.id || '1'}
              cashBalance={cashBalance}
              onNavigateToMarket={() => navigate('/transfers?tab=staff')}
            />
          }
        />
        <Route
          path="/tactics"
          element={
            <TacticsView
              club={club}
              players={players}
            />
          }
        />
        <Route
          path="/matches"
          element={
            <MatchCenterView
              club={club}
              timeline={timeline}
              onMatchSimulated={refreshClubData}
            />
          }
        />
        <Route
          path="/transfers"
          element={
            <TransfersView
              currentClubId={club?.id || '1'}
              cashBalance={cashBalance}
              onRefreshFinance={refreshClubData}
            />
          }
        />
        <Route
          path="/club/transfers"
          element={
            <ClubTransfersView
              currentClubId={club?.id || '1'}
              cashBalance={cashBalance}
              season={timeline?.season}
              onRefreshFinance={refreshClubData}
            />
          }
        />
        <Route
          path="/facilities"
          element={
            <FacilitiesView
              onUpgradeFacility={handleUpgradeFacility}
              club={club}
            />
          }
        />
        <Route
          path="/finances"
          element={
            <FinancesView
              currentClubId={club?.id || '1'}
              onRefreshBalance={refreshClubData}
            />
          }
        />
        <Route
          path="/training"
          element={
            <TrainingView
              currentClubId={club?.id || '1'}
            />
          }
        />
        <Route path="/competitions/league" element={<LeagueView />} />
        <Route path="/competitions/cup" element={<KnockoutCupView />} />
        <Route path="/competitions/youth" element={<GroupKnockoutView />} />
        <Route path="/competitions/continental" element={<GroupKnockoutView />} />
        <Route path="/competitions/international" element={<GroupKnockoutView />} />
        <Route path="/standings" element={<LeagueView />} />
        <Route
          path="/trophies"
          element={
            <TrophiesView
              club={club}
              currentClubId={club?.id || '1'}
            />
          }
        />
        <Route path="/clubs/:id" element={<ClubDetailView />} />
      </Route>

      {/* Fallback Catch-all Route */}
      <Route
        path="*"
        element={
          <Navigate
            to={user && club ? '/dashboard' : user ? '/onboarding' : '/login'}
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;






