import { useTranslation } from '../../i18n';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { StandingItem } from '../../types';

interface LeagueStandingsTableProps {
  currentTableRows: StandingItem[];
  currentClubId?: string;
  currentTier?: number | null;
  compFormatType?: string;
  groupName?: string;
}

export const LeagueStandingsTable: React.FC<LeagueStandingsTableProps> = ({
  currentTableRows,
  currentClubId,
  currentTier,
  compFormatType,
  groupName,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--game-line)' }}>
      {groupName && (
        <div
          style={{
            background: 'linear-gradient(90deg, var(--game-green-deep) 0%, var(--game-green-strong) 100%)',
            color: 'var(--game-on-color)',
            padding: '12px 16px',
            fontWeight: 800,
            fontSize: '1rem',
          }}
        >
          {t('standings.table_title', '{group} - Bảng Xếp Hạng').replace('{group}', groupName || '')}
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--game-input)', borderBottom: '1.5px solid var(--game-line)', color: 'var(--game-text)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
              <th style={{ width: '55px', textAlign: 'center', padding: '12px 8px' }}>{t('standings.col_rank')}</th>
              <th style={{ textAlign: 'left', padding: '12px 14px' }}>{t('standings.col_club')}</th>
              <th style={{ textAlign: 'center', width: '60px' }}>{t('standings.col_played')}</th>
              <th style={{ textAlign: 'center', width: '55px', color: 'var(--game-success)' }}>{t('standings.col_won')}</th>
              <th style={{ textAlign: 'center', width: '55px', color: 'var(--game-muted)' }}>{t('standings.col_drawn')}</th>
              <th style={{ textAlign: 'center', width: '55px', color: 'var(--game-danger)' }}>{t('standings.col_lost')}</th>
              <th style={{ textAlign: 'center', width: '60px' }}>{t('standings.col_gf')}</th>
              <th style={{ textAlign: 'center', width: '60px' }}>{t('standings.col_ga')}</th>
              <th style={{ textAlign: 'center', width: '60px' }}>{t('standings.col_gd')}</th>
              <th style={{ textAlign: 'center', width: '70px', fontWeight: 800, color: 'var(--game-accent)' }}>{t('standings.col_pts', 'ĐIỂM')}</th>
            </tr>
          </thead>
          <tbody>
            {currentTableRows.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--game-muted)' }}>
                  <Trophy size={36} color="var(--game-dim)" style={{ marginBottom: '8px', display: 'inline-block' }} />
                  <p style={{ margin: 0, fontSize: '0.95rem' }}>{t('standings.no_data', 'Chưa có dữ liệu bảng xếp hạng cho giải đấu này.')}</p>
                </td>
              </tr>
            ) : (
              currentTableRows.map((row, idx) => {
                const clubId = row.club?.id || row.club_id;
                const isCurrent = clubId && clubId.toString() === currentClubId?.toString();
                const pos = row.position || idx + 1;
                const wins = row.wins ?? row.won ?? 0;
                const draws = row.draws ?? row.drawn ?? 0;
                const losses = row.losses ?? row.lost ?? 0;
                const gf = row.goals_for ?? 0;
                const ga = row.goals_against ?? 0;
                const gd = row.goal_difference ?? gf - ga;
                const pts = row.points ?? 0;

                // Promotion & Relegation badges based on Tier
                let posBg = 'var(--game-raised)';
                let posColor = 'var(--game-text)';
                let badgeTooltip = '';

                if (compFormatType === 'GROUP_KNOCKOUT') {
                  if (pos <= 2) {
                    posBg = 'var(--game-accent-soft)';
                    posColor = 'var(--game-accent)';
                    badgeTooltip = t('standings.badge_knockout', 'Vào Vòng Knockout (Top 2)');
                  }
                } else if (currentTier === 1) {
                  if (pos <= 3) {
                    posBg = 'var(--game-info-soft)';
                    posColor = 'var(--game-info)';
                    badgeTooltip = t('standings.badge_c1', 'Cúp C1 Châu Lục');
                  } else if (pos <= 5) {
                    posBg = 'var(--game-violet-soft)';
                    posColor = 'var(--game-violet)';
                    badgeTooltip = t('standings.badge_c2', 'Cúp C2 Châu Lục');
                  } else if (pos <= 7) {
                    posBg = 'var(--game-gold-soft)';
                    posColor = 'var(--game-gold)';
                    badgeTooltip = t('standings.badge_c3', 'Cúp C3 Châu Lục');
                  } else if (pos >= 15) {
                    posBg = 'var(--game-danger-soft)';
                    posColor = 'var(--game-danger)';
                    badgeTooltip = t('standings.badge_rel_t2', 'Xuống Hạng Nhất (Tier 2)');
                  }
                } else if (currentTier === 2) {
                  if (pos === 1) {
                    posBg = 'var(--game-accent-soft)';
                    posColor = 'var(--game-accent)';
                    badgeTooltip = t('standings.badge_prom_t1', 'Thăng Hạng Tier 1 (VĐQG)');
                  } else if (pos >= 15) {
                    posBg = 'var(--game-danger-soft)';
                    posColor = 'var(--game-danger)';
                    badgeTooltip = t('standings.badge_rel_t3', 'Xuống Hạng Nhì (Tier 3)');
                  }
                } else if (currentTier === 3) {
                  if (pos === 1) {
                    posBg = 'var(--game-accent-soft)';
                    posColor = 'var(--game-accent)';
                    badgeTooltip = t('standings.badge_prom_t2', 'Thăng Hạng Tier 2 (Hạng Nhất)');
                  } else if (pos >= 15) {
                    posBg = 'var(--game-danger-soft)';
                    posColor = 'var(--game-danger)';
                    badgeTooltip = t('standings.badge_rel_t4', 'Xuống Hạng Ba (Tier 4)');
                  }
                } else if (currentTier === 4) {
                  if (pos === 1) {
                    posBg = 'var(--game-accent-soft)';
                    posColor = 'var(--game-accent)';
                    badgeTooltip = t('standings.badge_prom_t3', 'Thăng Hạng Tier 3 (Hạng Nhì)');
                  }
                }

                return (
                  <tr
                    key={row.id || idx}
                    onClick={() => clubId && navigate(`/clubs/${clubId}`)}
                    className="hover:bg-game-accent-soft cursor-pointer group"
                    title={t('standings.view_club_detail', 'Nhấp để xem chi tiết CLB {name}').replace('{name}', row.club?.name || '')}
                    style={{
                      borderBottom: '1px solid var(--game-line)',
                      backgroundColor: isCurrent ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
                      borderLeft: isCurrent ? '5px solid var(--game-success)' : '5px solid transparent',
                      boxShadow: isCurrent ? 'inset 0 0 0 1px rgba(34, 197, 94, 0.25), 0 2px 8px rgba(34, 197, 94, 0.08)' : 'none',
                      fontWeight: isCurrent ? 800 : 400,
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                  >
                    <td style={{ textAlign: 'center', padding: '10px 8px' }}>
                      <span
                        title={badgeTooltip}
                        style={{
                          display: 'inline-block',
                          width: '26px',
                          height: '26px',
                          lineHeight: '26px',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          backgroundColor: isCurrent ? 'var(--game-green-strong)' : posBg,
                          color: isCurrent ? 'var(--game-gold)' : posColor,
                          boxShadow: isCurrent ? '0 1px 4px rgba(21, 128, 61, 0.3)' : 'none',
                        }}
                      >
                        {pos}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: isCurrent ? 'var(--game-accent-soft)' : 'var(--game-raised)',
                            border: isCurrent ? '1.5px solid var(--game-green-line)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            flexShrink: 0,
                          }}
                        >
                          {row.club?.logo_url ? (
                            <img
                              src={row.club.logo_url}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          ) : (
                            '⚽'
                          )}
                        </div>
                        <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              color: isCurrent ? 'var(--game-accent)' : 'var(--game-ink)',
                              fontWeight: isCurrent ? 800 : 600,
                              fontSize: isCurrent ? '0.93rem' : '0.9rem',
                            }}
                          >
                            {row.club?.name || (row as any).club_name || `CLB #${clubId}`}
                          </span>
                          {isCurrent && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '0.68rem',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: 'var(--game-green-strong)',
                                color: 'var(--game-gold)',
                                fontWeight: 800,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                letterSpacing: '0.3px',
                              }}
                            >
                              <span>⭐</span>
                              <span>{t('standings.your_club_badge', 'CLB CỦA BẠN')}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--game-text)', fontSize: '0.88rem' }}>{row.played || 0}</td>
                    <td style={{ textAlign: 'center', color: 'var(--game-success)', fontSize: '0.88rem' }}>{wins}</td>
                    <td style={{ textAlign: 'center', color: 'var(--game-muted)', fontSize: '0.88rem' }}>{draws}</td>
                    <td style={{ textAlign: 'center', color: 'var(--game-danger)', fontSize: '0.88rem' }}>{losses}</td>
                    <td style={{ textAlign: 'center', color: 'var(--game-muted)', fontSize: '0.88rem' }}>{gf}</td>
                    <td style={{ textAlign: 'center', color: 'var(--game-muted)', fontSize: '0.88rem' }}>{ga}</td>
                    <td
                      style={{
                        textAlign: 'center',
                        color: gd > 0 ? 'var(--game-success)' : gd < 0 ? 'var(--game-danger)' : 'var(--game-muted)',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                      }}
                    >
                      {gd > 0 ? `+${gd}` : gd}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--game-accent)', fontSize: '1rem' }}>
                      {pts}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
