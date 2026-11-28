import { useTranslation } from '../../i18n';
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Target, TrendingUp, Award, Loader2, ChevronRight } from 'lucide-react';
import { playersApi } from '../../services/players.service';
import { Player } from '../../types';

interface PlayerStatItem {
  player?: {
    id?: string | number;
    name?: string;
    common_name?: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
  };
  playerId?: string | number;
  playerName?: string;
  club?: {
    name?: string;
    logo_url?: string;
  };
  clubName?: string;
  goals?: number;
  assists?: number;
  appearances?: number;
  rating?: number | string;
  motm?: number;
}

interface LeagueStatsViewProps {
  topScorers: PlayerStatItem[];
  topAssists: PlayerStatItem[];
  topPlayers: PlayerStatItem[];
  onSelectPlayer?: (player: Player) => void;
}

export const LeagueStatsView: React.FC<LeagueStatsViewProps> = ({
  topScorers,
  topAssists,
  topPlayers,
  onSelectPlayer,
}) => {
  const { t } = useTranslation();
  const outlet = useOutletContext<{ setSelectedPlayer?: (player: Player | null) => void }>() || {};
  const [loadingPlayerId, setLoadingPlayerId] = useState<string | null>(null);

  const handlePlayerClick = async (ps: PlayerStatItem) => {
    const pId = ps.player?.id || ps.playerId;
    if (!pId) return;

    const stringId = String(pId);
    try {
      setLoadingPlayerId(stringId);
      const fullPlayer = await playersApi.getPlayerById(stringId);
      if (fullPlayer) {
        if (onSelectPlayer) {
          onSelectPlayer(fullPlayer);
        } else if (outlet.setSelectedPlayer) {
          outlet.setSelectedPlayer(fullPlayer);
        }
      }
    } catch (err) {
      console.error('Failed to load player details for stats modal:', err);
      // Fallback nếu API lỗi mạng nhưng ps có đủ dữ liệu
      const fallbackPlayer: any = {
        id: stringId,
        first_name: ps.player?.first_name || '',
        last_name: ps.player?.last_name || ps.playerName || 'Player',
        name: ps.player?.name || ps.player?.common_name || ps.playerName,
        club: ps.club || (ps.clubName ? { name: ps.clubName } : undefined),
      };
      if (onSelectPlayer) {
        onSelectPlayer(fallbackPlayer);
      } else if (outlet.setSelectedPlayer) {
        outlet.setSelectedPlayer(fallbackPlayer);
      }
    } finally {
      setLoadingPlayerId(null);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.25rem' }}>
      {/* Top Scorers */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--game-ink)',
            margin: '0 0 1rem 0',
          }}
        >
          <Target size={20} color="var(--game-success)" />
          <span>{t('standings.top_scorers')}</span>
        </h3>
        {topScorers.length === 0 ? (
          <p style={{ color: 'var(--game-muted)', fontSize: '0.88rem' }}>{t('standings.no_goals')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topScorers.slice(0, 10).map((ps, idx) => {
              const pId = ps.player?.id || ps.playerId;
              const stringId = pId ? String(pId) : '';
              const isLoadingThis = loadingPlayerId === stringId;
              const pName =
                ps.player?.name ||
                ps.player?.common_name ||
                `${ps.player?.first_name || ''} ${ps.player?.last_name || ''}`.trim() ||
                ps.playerName ||
                t('common.player', 'Cầu Thủ');
              const cName = ps.club?.name || ps.clubName || 'CLB';
              return (
                <div
                  key={stringId || idx}
                  onClick={() => pId && handlePlayerClick(ps)}
                  className="league-stat-player-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: idx === 0 ? 'var(--game-accent-soft)' : 'var(--game-input)',
                    border: idx === 0 ? '1px solid var(--game-green-line)' : '1px solid var(--game-line)',
                    cursor: pId ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                  }}
                  title={pId ? t('standings.view_player_detail', 'Nhấp để xem hồ sơ chi tiết cầu thủ') : undefined}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 800, width: '20px', color: idx === 0 ? 'var(--game-accent)' : 'var(--game-muted)' }}>
                      {idx + 1}
                    </span>
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: 'var(--game-ink)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span className="player-name-link">{pName}</span>
                        {isLoadingThis && <Loader2 size={13} className="animate-spin text-game-accent" />}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--game-muted)' }}>{cName}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--game-success)' }}>
                      {ps.goals || 0} <span style={{ fontSize: '0.72rem', color: 'var(--game-muted)', fontWeight: 600 }}>{t('stats.goals_unit', 'BÀN')}</span>
                    </div>
                    {pId && <ChevronRight size={14} color="var(--game-dim)" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Assists */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--game-ink)',
            margin: '0 0 1rem 0',
          }}
        >
          <TrendingUp size={20} color="var(--game-accent)" />
          <span>{t('standings.top_assists')}</span>
        </h3>
        {topAssists.length === 0 ? (
          <p style={{ color: 'var(--game-muted)', fontSize: '0.88rem' }}>{t('stats.no_assists', 'Chưa có đường kiến tạo nào được ghi nhận.')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topAssists.slice(0, 10).map((ps, idx) => {
              const pId = ps.player?.id || ps.playerId;
              const stringId = pId ? String(pId) : '';
              const isLoadingThis = loadingPlayerId === stringId;
              const pName =
                ps.player?.name ||
                ps.player?.common_name ||
                `${ps.player?.first_name || ''} ${ps.player?.last_name || ''}`.trim() ||
                ps.playerName ||
                t('common.player', 'Cầu Thủ');
              const cName = ps.club?.name || ps.clubName || 'CLB';
              return (
                <div
                  key={stringId || idx}
                  onClick={() => pId && handlePlayerClick(ps)}
                  className="league-stat-player-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: idx === 0 ? 'var(--game-accent-soft)' : 'var(--game-input)',
                    border: idx === 0 ? '1px solid var(--game-green-line)' : '1px solid var(--game-line)',
                    cursor: pId ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                  }}
                  title={pId ? t('standings.view_player_detail', 'Nhấp để xem hồ sơ chi tiết cầu thủ') : undefined}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 800, width: '20px', color: idx === 0 ? 'var(--game-accent)' : 'var(--game-muted)' }}>
                      {idx + 1}
                    </span>
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: 'var(--game-ink)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span className="player-name-link">{pName}</span>
                        {isLoadingThis && <Loader2 size={13} className="animate-spin text-game-accent" />}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--game-muted)' }}>{cName}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--game-accent)' }}>
                      {ps.assists || 0} <span style={{ fontSize: '0.72rem', color: 'var(--game-muted)', fontWeight: 600 }}>{t('stats.assists_unit', 'KIẾN TẠO')}</span>
                    </div>
                    {pId && <ChevronRight size={14} color="var(--game-dim)" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Players */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--game-ink)',
            margin: '0 0 1rem 0',
          }}
        >
          <Award size={20} color="var(--game-accent)" />
          <span>{t('standings.top_players')}</span>
        </h3>
        <p style={{ color: 'var(--game-muted)', fontSize: '0.78rem', margin: '-0.5rem 0 1rem' }}>{t('stats.best_players_criteria')}</p>
        {topPlayers.length === 0 ? (
          <p style={{ color: 'var(--game-muted)', fontSize: '0.88rem' }}>{t('stats.no_ratings')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topPlayers.slice(0, 10).map((ps, idx) => {
              const pId = ps.player?.id || ps.playerId;
              const stringId = pId ? String(pId) : '';
              const isLoadingThis = loadingPlayerId === stringId;
              const pName =
                ps.player?.name ||
                ps.player?.common_name ||
                `${ps.player?.first_name || ''} ${ps.player?.last_name || ''}`.trim() ||
                ps.playerName ||
                t('common.player', 'Cầu Thủ');
              const cName = ps.club?.name || ps.clubName || 'CLB';
              return (
                <div
                  key={stringId || idx}
                  onClick={() => pId && handlePlayerClick(ps)}
                  className="league-stat-player-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: idx === 0 ? 'var(--game-accent-soft)' : 'var(--game-input)',
                    border: idx === 0 ? '1px solid var(--game-green-line)' : '1px solid var(--game-line)',
                    cursor: pId ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                  }}
                  title={pId ? t('standings.view_player_detail', 'Nhấp để xem hồ sơ chi tiết cầu thủ') : undefined}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 800, width: '20px', color: idx === 0 ? 'var(--game-accent)' : 'var(--game-muted)' }}>
                      {idx + 1}
                    </span>
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: 'var(--game-ink)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span className="player-name-link">{pName}</span>
                        {isLoadingThis && <Loader2 size={13} className="animate-spin text-game-accent" />}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--game-muted)' }}>{cName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--game-muted)' }}>
                        {ps.appearances || 0} {t('stats.appearances_unit')} · {ps.motm || 0} {t('stats.motm_unit')}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--game-accent)' }}>
                      {Number(ps.rating || 0).toFixed(2)} <span style={{ fontSize: '0.72rem', color: 'var(--game-muted)', fontWeight: 600 }}>{t('stats.rating_unit')}</span>
                    </div>
                    {pId && <ChevronRight size={14} color="var(--game-dim)" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
