import { useTranslation } from '../../i18n';
import { useTournamentLocale } from '../../utils/tournamentLocalization';
import React from 'react';
import { KnockoutBracketResponse, KnockoutRound } from '../../types';
import { Swords, Calendar, CheckCircle2 } from 'lucide-react';

interface KnockoutProps {
  knockoutBracket: KnockoutBracketResponse | null;
  selectedRoundName: string;
  setSelectedRoundName: (name: string) => void;
  allKnockoutRounds: KnockoutRound[];
  filteredKnockoutRounds: KnockoutRound[];
  currentClubId: string;
}

export const KnockoutBracketSection: React.FC<KnockoutProps> = ({
  knockoutBracket,
  selectedRoundName,
  setSelectedRoundName,
  allKnockoutRounds,
  filteredKnockoutRounds,
  currentClubId,
}) => {
  const { t } = useTranslation();
  const { round } = useTournamentLocale();
  if (!knockoutBracket || allKnockoutRounds.length === 0) {
    return (
      <div className="card text-center" style={{ padding: '3.5rem', borderRadius: '16px' }}>
        <Swords size={40} color="var(--game-dim)" style={{ marginBottom: '8px', display: 'inline-block' }} />
        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--game-muted)', fontWeight: 600 }}>
          {t('standings.no_bracket')}
        </p>
      </div>
    );
  }

  const activeRound = filteredKnockoutRounds[0] || allKnockoutRounds[0];

  return (
    <div>
      {/* Round Selection Header & Dropdown */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          background: 'var(--game-surface)',
          padding: '10px 14px',
          borderRadius: '12px',
          border: '1px solid var(--game-line)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Swords size={20} color="var(--game-accent)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--game-ink)', margin: 0 }}>
            {round(activeRound?.roundName) || t('knockout.round_fallback', 'Vòng Đấu')}
          </h3>
          {activeRound && (
            <span
              style={{
                fontSize: '0.75rem',
                background: 'var(--game-accent-soft)',
                color: 'var(--game-accent)',
                padding: '2px 8px',
                borderRadius: '10px',
                fontWeight: 700,
              }}
            >
              {t('knockout.match_pairs', '{count} Cặp Đấu • Ngày {day}').replace('{count}', String(activeRound.matches.length)).replace('{day}', String(activeRound.seasonDay))}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--game-muted)', fontWeight: 600 }}>{t('knockout.select_round', 'Chọn Vòng:')}</span>
          <select
            value={activeRound?.roundName || selectedRoundName}
            onChange={(e) => setSelectedRoundName(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1.5px solid var(--game-success)',
              fontWeight: 700,
              fontSize: '0.84rem',
              color: 'var(--game-accent)',
              backgroundColor: 'var(--game-accent-soft)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {allKnockoutRounds.map((rnd) => (
              <option key={rnd.roundOrder} value={rnd.roundName}>
                {t('knockout.round_summary', '{name} (Ngày {day} - {matches} trận)').replace('{name}', round(rnd.roundName)).replace('{day}', String(rnd.seasonDay)).replace('{matches}', String(rnd.matches.length))}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Round Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem', overflowX: 'auto', padding: '4px 0' }}>
        {allKnockoutRounds.map((rnd) => {
          const isSelected = (activeRound?.roundName || selectedRoundName) === rnd.roundName;
          return (
            <button
              key={rnd.roundOrder}
              type="button"
              onClick={() => setSelectedRoundName(rnd.roundName)}
              style={{
                padding: '7px 14px',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: isSelected ? 800 : 600,
                border: isSelected ? '1.5px solid var(--game-success)' : '1px solid var(--game-line-strong)',
                cursor: 'pointer',
                backgroundColor: isSelected ? 'var(--game-green-strong)' : 'var(--game-surface)',
                color: isSelected ? 'var(--game-on-color)' : 'var(--game-muted)',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: isSelected ? '0 2px 6px rgba(21, 128, 61, 0.25)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{round(rnd.roundName)}</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '1px 5px',
                  borderRadius: '8px',
                  background: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'var(--game-raised)',
                  color: isSelected ? 'var(--game-on-color)' : 'var(--game-muted)',
                  fontWeight: 700,
                }}
              >
                {rnd.matches.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Render Selected Round ONLY */}
      {activeRound && (
        <div key={activeRound.roundOrder} style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
            {activeRound.matches.map((match: any) => {
              const isHomeCurrent = match.homeClub?.id && match.homeClub.id.toString() === currentClubId?.toString();
              const isAwayCurrent = match.awayClub?.id && match.awayClub.id.toString() === currentClubId?.toString();
              const isHomeWinner = match.homeScore != null && match.awayScore != null && Number(match.homeScore) > Number(match.awayScore);
              const isAwayWinner = match.homeScore != null && match.awayScore != null && Number(match.awayScore) > Number(match.homeScore);

              return (
                <div
                  key={match.id}
                  className="card"
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: isHomeCurrent || isAwayCurrent ? '2px solid var(--game-success)' : '1px solid var(--game-line)',
                    background: isHomeCurrent || isAwayCurrent ? 'var(--game-accent-soft)' : 'var(--game-surface)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  }}
                >
                  {/* Match Meta Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--game-muted)', marginBottom: '8px', borderBottom: '1px solid var(--game-line)', paddingBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      <span>{t('knockout.day_n', 'Ngày {day}').replace('{day}', String(match.seasonDay || 1))}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: match.status === 'COMPLETED' ? 'var(--game-accent)' : 'var(--game-accent)' }}>
                      {match.status === 'COMPLETED' ? t('common.finished', 'ĐÃ KẾT THÚC') : t('common.upcoming', 'SẮP DIỄN RA')}
                    </span>
                  </div>

                  {/* Team Home */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px', borderRadius: '6px', background: isHomeWinner ? 'var(--game-accent-soft)' : 'transparent', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '1rem' }}>⚽</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: isHomeWinner || isHomeCurrent ? 700 : 500, color: isHomeWinner ? 'var(--game-accent)' : isHomeCurrent ? 'var(--game-accent)' : 'var(--game-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {match.homeClub?.name || t('matches.home_team', 'Đội Nhà')}
                      </span>
                      {isHomeCurrent && <span style={{ fontSize: '0.65rem', background: 'var(--game-green-strong)', color: 'var(--game-on-color)', padding: '1px 4px', borderRadius: '4px', fontWeight: 700 }}>{t('knockout.you_badge', 'BẠN')}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isHomeWinner && <CheckCircle2 size={14} color="var(--game-accent)" />}
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: isHomeWinner ? 'var(--game-accent)' : 'var(--game-ink)', minWidth: '20px', textAlign: 'center' }}>
                        {match.homeScore !== null ? match.homeScore : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Team Away */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px', borderRadius: '6px', background: isAwayWinner ? 'var(--game-accent-soft)' : 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '1rem' }}>⚽</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: isAwayWinner || isAwayCurrent ? 700 : 500, color: isAwayWinner ? 'var(--game-accent)' : isAwayCurrent ? 'var(--game-accent)' : 'var(--game-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {match.awayClub?.name || t('matches.away_team', 'Đội Khách')}
                      </span>
                      {isAwayCurrent && <span style={{ fontSize: '0.65rem', background: 'var(--game-green-strong)', color: 'var(--game-on-color)', padding: '1px 4px', borderRadius: '4px', fontWeight: 700 }}>{t('knockout.you_badge', 'BẠN')}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isAwayWinner && <CheckCircle2 size={14} color="var(--game-accent)" />}
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: isAwayWinner ? 'var(--game-accent)' : 'var(--game-ink)', minWidth: '20px', textAlign: 'center' }}>
                        {match.awayScore !== null ? match.awayScore : '-'}
                      </span>
                    </div>
                  </div>

                  {match.homePenaltyScore !== null && match.awayPenaltyScore !== null && (
                    <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--game-muted)', background: 'var(--game-input)', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>
                      Penalty: <strong>{match.homePenaltyScore}</strong> - <strong>{match.awayPenaltyScore}</strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
