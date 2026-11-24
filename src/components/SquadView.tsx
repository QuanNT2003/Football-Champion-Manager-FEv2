import { useTranslation } from '../i18n';
import { PlayerAvatar } from './common/PlayerAvatar';
import React, { useState } from 'react';
import { Player } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Search, Users, Shield, Sparkles, Award, Zap, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { playersApi } from '../services/players.service';
import { SquadSortHeader } from './common/SquadSortHeader';
import {
  defaultSquadSort, getSquadFitness, getSquadOvr, getSquadPosition, getSquadPositionCategory,
  getSquadPotential, getSquadValue, nextSquadSort, sortSquadPlayers,
} from '../utils/squadSorting';
import type { SquadSort, SquadSortKey } from '../utils/squadSorting';

interface Props {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
  onUpdateTransferListing: (playerId: string, isTransfer: boolean, isLoan: boolean, price?: number) => void;
  onRefreshSquad?: () => void;
}

export const SquadView: React.FC<Props> = ({ players, onSelectPlayer, onRefreshSquad }) => {
  const { t } = useTranslation();
  const [squadTab, setSquadTab] = useState<'FIRST_TEAM' | 'YOUTH_U21'>('FIRST_TEAM');
  const [sorts, setSorts] = useState<Record<'FIRST_TEAM' | 'YOUTH_U21', SquadSort>>({
    FIRST_TEAM: defaultSquadSort, YOUTH_U21: defaultSquadSort,
  });
  const sort = sorts[squadTab];
  const handleSort = (key: SquadSortKey) => setSorts(current => ({
    ...current, [squadTab]: nextSquadSort(current[squadTab], key),
  }));
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [movingPlayerId, setMovingPlayerId] = useState<string | null>(null);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  const handleMoveSquad = async (player: Player) => {
    const isCurrentFirstTeam = !player.squad_type || player.squad_type === 'FIRST_TEAM';
    const targetSquad: 'FIRST_TEAM' | 'YOUTH_U21' = isCurrentFirstTeam ? 'YOUTH_U21' : 'FIRST_TEAM';

    setMovingPlayerId(player.id);
    try {
      const res = await playersApi.moveSquad(player.id, targetSquad);
      const assignedNum = res.player?.squad_number;
      const playerName = player.name || `${player.first_name || ''} ${player.last_name || ''}`.trim() || player.common_name || t('common.player', 'Cầu thủ');
      const msg = targetSquad === 'FIRST_TEAM'
        ? t('squad.promote_success', 'Đã đưa {name} lên Đội Một thành công với số áo #{num}!')
            .replace('{name}', playerName)
            .replace('{num}', String(assignedNum))
        : t('squad.demote_success', 'Đã chuyển {name} xuống Đội Trẻ U21 thành công với số áo #{num}!')
            .replace('{name}', playerName)
            .replace('{num}', String(assignedNum));
      setSuccessNotification(msg);
      setTimeout(() => setSuccessNotification(null), 4000);
      onRefreshSquad?.();
    } catch (err: any) {
      console.error('Failed to move player squad:', err);
      alert(err.response?.data?.message || err.message || t('squad.modal_move_failed', 'Không thể điều chuyển đội hình'));
    } finally {
      setMovingPlayerId(null);
    }
  };

  const firstTeamCount = players.filter((p) => !p.squad_type || p.squad_type === 'FIRST_TEAM').length;
  const youthCount = players.filter((p) => p.squad_type === 'YOUTH_U21' || p.squad_type === 'YOUTH_U19').length;
  
  const filtered = players.filter((p) => {
    // 1. Tách biệt hai đội 1 và đội trẻ - ở tab nào chỉ hiện đội đó
    if (squadTab === 'FIRST_TEAM') {
      if (p.squad_type && p.squad_type !== 'FIRST_TEAM') return false;
    } else {
      if (p.squad_type !== 'YOUTH_U21' && p.squad_type !== 'YOUTH_U19') return false;
    }

    // 2. Lọc theo Vị Trí (Position)
    const cat = getSquadPositionCategory(getSquadPosition(p));
    if (filterType !== 'ALL') {
      if (['GK', 'DEF', 'MID', 'FWD'].includes(filterType)) {
        if (cat !== filterType) return false;
      } else if (p.squad_type !== filterType) {
        return false;
      }
    }

    // 3. Tìm kiếm theo tên
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const fullName = (p.name || `${p.first_name || ''} ${p.last_name || ''}` || p.common_name || '').toLowerCase();
      if (!fullName.includes(q)) return false;
    }

    return true;
  });
  const sortedPlayers = sortSquadPlayers(filtered, sort);

  return (
    <div className="view-container squad-page-view">
      {/* Toast Notification Banner */}
      {successNotification && (
        <div
          style={{
            padding: '12px 20px',
            borderRadius: '12px',
            background: 'var(--game-accent-soft)',
            border: '1.5px solid var(--game-green-line)',
            color: 'var(--game-success)',
            fontWeight: 700,
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <CheckCircle2 size={18} style={{ color: 'var(--game-success)', flexShrink: 0 }} />
          <span>{successNotification}</span>
        </div>
      )}

      {/* Control Bar: Filters & Search */}
      <div className="glass-panel" style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* SQUAD LEVEL TABS (Đội Một / Đội Trẻ U21 / Đội Dự Bị) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1.5px solid rgba(255, 255, 255, 0.1)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${squadTab === 'FIRST_TEAM' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSquadTab('FIRST_TEAM')}
              style={{
                fontWeight: 700,
                padding: '7px 16px',
                borderRadius: '8px',
                ...(squadTab === 'FIRST_TEAM' ? {
                  background: 'var(--game-green-strong)',
                  borderColor: 'var(--game-success)',
                  color: 'var(--game-on-color)',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                } : {})
              }}
            >
              <Shield size={14} style={{ marginRight: 5, display: 'inline' }} /> {t('squad.first_team', 'Đội Một')} ({firstTeamCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${squadTab === 'YOUTH_U21' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSquadTab('YOUTH_U21')}
              style={{
                fontWeight: 700,
                padding: '7px 16px',
                borderRadius: '8px',
                ...(squadTab === 'YOUTH_U21' ? {
                  background: 'var(--game-green-strong)', borderColor: 'var(--game-success)', color: 'var(--game-on-color)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                } : {})
              }}
            >
              <Sparkles size={14} style={{ marginRight: 5, display: 'inline' }} /> {t('squad.youth_team', 'Đội Trẻ U21')} ({youthCount})
            </button>
            
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--game-muted)', fontWeight: 600 }}>
            {squadTab === 'FIRST_TEAM' && t('squad.first_team_desc', '⚽ Danh sách thi đấu chính thức Đội Một')}
            {squadTab === 'YOUTH_U21' && t('squad.youth_team_desc', '✨ Tài năng trẻ Học viện U21 & Cúp U21 Quốc Gia')}
          </div>
        </div>

        {/* Position Filter Pills & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: `${t('squad.tab_all_positions', 'Tất Cả Vị Trí')} (${filtered.length})` },
              { id: 'GK', label: t('squad.tab_gk', 'Thủ Môn') },
              { id: 'DEF', label: t('squad.tab_def', 'Hậu Vệ') },
              { id: 'MID', label: t('squad.tab_mid', 'Tiền Vệ') },
              { id: 'FWD', label: t('squad.tab_fwd', 'Tiền Đạo') },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`btn btn-sm ${filterType === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterType(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--game-dim)' }} />
            <input
              type="text"
              className="input-text"
              placeholder={t('squad.search_placeholder', 'Tìm cầu thủ theo tên...')}
              style={{
                width: '100%',
                paddingLeft: '36px',
                paddingTop: '8px',
                paddingBottom: '8px',
                borderRadius: '10px',
                border: '1.5px solid var(--game-line-strong)',
                background: 'var(--game-input)',
                fontSize: '0.88rem',
                color: 'var(--game-ink)'
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* SQUAD LIST (TABLE VIEW ONLY) */}
      <div className="glass-panel" style={{ overflowX: 'auto', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={20} className="text-cyan" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--game-ink)', margin: 0 }}>
              {t('squad.title', 'DANH SÁCH CẦU THỦ CÂU LẠC BỘ')} ({filtered.length})
            </h3>
          </div>
        </div>

        <table className="table-hud">
          <thead>
            <tr>
              <SquadSortHeader sortKey="position" sort={sort} onSort={handleSort}>{t('squad.col_position', 'VỊ TRÍ')}</SquadSortHeader>
              <th>{t('squad.col_player', 'CẦU THỦ')}</th>
              <th style={{ width: '60px' }}>{t('squad.col_number', 'SỐ')}</th>
              <SquadSortHeader sortKey="age" sort={sort} onSort={handleSort}>{t('squad.col_age', 'TUỔI')}</SquadSortHeader>
              <SquadSortHeader sortKey="ovr" sort={sort} onSort={handleSort}>{t('squad.col_ovr', 'ĐIỂM OVR')}</SquadSortHeader>
              <SquadSortHeader sortKey="potential" sort={sort} onSort={handleSort}>{t('squad.col_potential', 'TIỀM NĂNG')}</SquadSortHeader>
              <SquadSortHeader sortKey="fitness" sort={sort} onSort={handleSort}>{t('squad.col_fitness', 'THỂ LỰC')}</SquadSortHeader>
              <th>{t('squad.col_status', 'TRẠNG THÁI')}</th>
              <SquadSortHeader sortKey="value" sort={sort} onSort={handleSort}>{t('squad.col_value', 'ĐỊNH GIÁ')}</SquadSortHeader>
              <th style={{ textAlign: 'right' }}>{t('squad.col_action', 'HÀNH ĐỘNG')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: 'var(--game-muted)' }}>
                  {t('squad.empty_filter', 'Không tìm thấy cầu thủ nào phù hợp bộ lọc')}
                </td>
              </tr>
            ) : (
              sortedPlayers.map((player) => {
                const fitness = getSquadFitness(player);
                const ovr = getSquadOvr(player);
                const potential = getSquadPotential(player);
                const value = getSquadValue(player);
                const posCode = getSquadPosition(player);
                const posCategory = getSquadPositionCategory(posCode);
                const playerName = player.name || `${player.first_name || ''} ${player.last_name || ''}`.trim() || player.common_name || t('common.player', 'Cầu Thủ');

                return (
                  <tr key={player.id} onClick={() => onSelectPlayer(player)} style={{ cursor: "pointer" }} title={t('squad.view_player_tooltip', 'Bấm để xem chi tiết cầu thủ')}>
                    <td>
                      <span className={`position-tag pos-${posCategory.toLowerCase()}`}>{posCode}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <PlayerAvatar
                          name={playerName}
                          position={posCode}
                          photoUrl={player.photo_url}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ color: 'var(--game-ink)', fontSize: '0.95rem' }}>{playerName}</strong>
                            {player.is_on_loan && (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  background: 'var(--game-gold-soft)',
                                  color: 'var(--game-gold)',
                                  border: '1px solid var(--game-gold-line)',
                                  fontWeight: 800,
                                }}
                                title={player.parent_club?.name ? `${t('player_modal.parent_club_label', 'CLB Chủ Quản:')} ${player.parent_club.name}` : undefined}
                              >
                                {t('squad.badge_loan', '🤝 Mượn')}
                              </span>
                            )}
                            {player.squad_type === 'YOUTH_U21' && (
                              <span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: '4px', background: 'var(--game-accent-soft)', color: 'var(--game-accent)', fontWeight: 800 }}>
                                {t('squad.badge_u21', '🌟 U21')}
                              </span>
                            )}
                                                        {(!player.squad_type || player.squad_type === 'FIRST_TEAM') && (
                              <span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: '4px', background: 'var(--game-accent-soft)', color: 'var(--game-accent)', fontWeight: 700 }}>
                                {t('squad.badge_first_team', '🛡️ Đội 1')}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--game-muted)' }}>
                            {typeof player.nationality === 'object' ? (player.nationality as any)?.name || t('common.international', 'Quốc tế') : (player.nationality || t('common.international', 'Quốc tế'))}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--game-accent)', fontFamily: 'var(--font-game)', fontSize: '1rem' }}>
                        #{player.squad_number || '-'}
                      </strong>
                    </td>
                    <td>
                      <span style={{ color: 'var(--game-text)', fontWeight: 600 }}>{player.age}</span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--game-gold)', fontSize: '1.1rem', fontFamily: 'var(--font-game)' }}>
                        {ovr ?? '—'}
                      </strong>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--game-accent)', fontFamily: 'var(--font-game)', fontSize: '1rem' }}>
                        {potential ?? '—'}
                      </strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '70px',
                          height: '6px',
                          background: 'var(--game-hover)',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${fitness ?? 0}%`,
                            height: '100%',
                            background: fitness == null ? 'var(--game-dim)' : fitness > 75 ? 'var(--game-green-strong)' : fitness > 50 ? 'var(--game-gold-strong)' : 'var(--game-danger-strong)'
                          }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-game)', color: 'var(--game-text)', fontWeight: 700 }}>
                          {fitness == null ? '—' : `${fitness}%`}
                        </span>
                      </div>
                    </td>
                    <td>
                      {player.status?.is_injured ? (
                        <span style={{ background: 'var(--game-danger-soft)', color: 'var(--game-danger)', border: '1px solid var(--game-danger-line)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {t('squad.status_injured', 'Chấn Thương 🚑')}
                        </span>
                      ) : player.status?.is_suspended ? (
                        <span style={{ background: 'var(--game-danger-soft)', color: 'var(--game-danger)', border: '1px solid var(--game-danger-line)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {t('squad.status_suspended', 'Treo Giò 🟥')}
                        </span>
                      ) : player.status?.is_transfer_listed ? (
                        <span style={{ background: 'var(--game-gold-soft)', color: 'var(--game-gold)', border: '1px solid var(--game-gold-line)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {t('squad.status_listed', 'Rao Bán 🏷️')}
                        </span>
                      ) : (
                        <span style={{ background: 'var(--game-accent-soft)', color: 'var(--game-accent)', border: '1px solid var(--game-green-line)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {t('squad.status_ready', 'Sẵn Sàng')}
                        </span>
                      )}
                    </td>
                    <td>
                      <strong style={{ color: 'var(--game-success)', fontFamily: 'var(--font-game)', fontSize: '0.95rem' }}>
                        {value == null ? '—' : formatCurrency(value)}
                      </strong>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                        {(!player.squad_type || player.squad_type === 'FIRST_TEAM') ? (
                          <button
                            type="button"
                            className="btn btn-sm"
                            disabled={movingPlayerId === player.id}
                            style={{
                              padding: '5px 12px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              background: 'var(--game-accent-soft)',
                              color: 'var(--game-success)',
                              border: '1px solid var(--game-green-line)',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              cursor: movingPlayerId === player.id ? 'not-allowed' : 'pointer',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s ease',
                              opacity: movingPlayerId === player.id ? 0.7 : 1,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveSquad(player);
                            }}
                            title={t('squad.tooltip_demote', 'Chuyển cầu thủ xuống Đội Trẻ U21')}
                          >
                            <span>{t('squad.btn_demote', 'Xuống Đội Trẻ')}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm"
                            disabled={movingPlayerId === player.id}
                            style={{
                              padding: '5px 12px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              background: 'var(--game-accent-soft)',
                              color: 'var(--game-success)',
                              border: '1px solid var(--game-green-line)',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              cursor: movingPlayerId === player.id ? 'not-allowed' : 'pointer',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s ease',
                              opacity: movingPlayerId === player.id ? 0.7 : 1,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveSquad(player);
                            }}
                            title={t('squad.tooltip_promote', 'Đưa cầu thủ lên Đội Một')}
                          >
                            <span>{t('squad.btn_promote', 'Lên Đội 1')}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPlayer(player);
                          }}
                        >
                          {t('common.details', 'Chi Tiết')}
                        </button>
                      </div>
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


