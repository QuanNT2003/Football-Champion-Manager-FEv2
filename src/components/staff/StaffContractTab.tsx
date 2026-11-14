import React from 'react';
import {
  FileText,
  Calendar,
  DollarSign,
  AlertTriangle,
  FileCheck,
  UserMinus,
  Building,
  Briefcase,
  History,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { StaffMarketItem, StaffDetailResponse } from '../../services/transfers.service';
import { formatCurrency } from '../../utils/formatters';
import { RoleBadge } from '../common/RoleBadge';

export interface StaffContractTabProps {
  staff: StaffMarketItem;
  detail: StaffDetailResponse | null;
  isCurrentOwnStaff: boolean;
  onOpenRenewModal: () => void;
  onOpenTerminateModal: () => void;
}

export const StaffContractTab: React.FC<StaffContractTabProps> = ({
  staff,
  detail,
  isCurrentOwnStaff,
  onOpenRenewModal,
  onOpenTerminateModal,
}) => {
  const { t } = useTranslation();

  const contract = detail?.currentContract;

  if (!contract || contract.status === 'TERMINATED' || contract.status === 'EXPIRED') {
    return (
      <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--game-muted)' }}>
        <FileText size={44} color="var(--game-dim)" style={{ margin: '0 auto 1rem' }} />
        <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, color: 'var(--game-text)', fontSize: '1.1rem' }}>
          {t('contract.staff_no_active_contract', 'Nhân Sự Hiện Đang Tự Do')}
        </h4>
        <p style={{ margin: 0, fontSize: '0.88rem' }}>
          {t('contract.staff_free_agent_desc', 'Chuyên gia chưa thuộc biên chế ban huấn luyện của bất kỳ câu lạc bộ nào.')}
        </p>
      </div>
    );
  }

  const currentSeason = contract.current_season || 1;
  const endSeason = contract.end_season_id || 1;
  const remainingSeasons = contract.remaining_seasons !== undefined
    ? contract.remaining_seasons
    : Math.max(0, endSeason - currentSeason);

  const isExpiringSoon = remainingSeasons <= 1;
  const wage = contract.weekly_wage || contract.salary || staff.wage || 0;
  const clubName = contract.club?.name || (staff as any).club?.name || (staff as any).clubName || t('player_modal.current_club', 'CLB Chủ Quản');
  const clubLogo = contract.club?.logo_url || (staff as any).club?.logo_url || (staff as any).clubLogo;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Expiration Banner Alert if <= 1 season */}
      {isExpiringSoon && (
        <div
          style={{
            background: 'var(--game-gold-soft)',
            border: '1.5px solid var(--game-gold-line)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--game-gold-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} color="var(--game-gold)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--game-gold)', fontSize: '0.92rem' }}>
                {remainingSeasons === 0
                  ? t('contract.staff_expires_this_season', 'Hợp đồng nhân sự sẽ hết hạn vào cuối mùa giải này!')
                  : t('contract.staff_expires_one_season', 'Hợp đồng nhân sự chỉ còn 1 mùa giải nữa là hết hạn!')}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--game-gold)', marginTop: '2px' }}>
                {isCurrentOwnStaff
                  ? t('contract.staff_renew_recommendation', 'Hãy chủ động gia hạn hợp đồng để giữ chân nhân sự cốt cán trong ban huấn luyện.')
                  : t('contract.expiring_soon_info', 'Nhân sự sắp hết hạn hợp đồng với CLB chủ quản.')}
              </div>
            </div>
          </div>

          {isCurrentOwnStaff && (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={onOpenRenewModal}
              style={{
                background: 'var(--game-green-strong)',
                borderColor: 'var(--game-success)',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                flexShrink: 0,
              }}
            >
              <FileCheck size={15} />
              <span>{t('contract.renew_btn', 'Gia Hạn Hợp Đồng')}</span>
            </button>
          )}
        </div>
      )}

      {/* Grid of Contract Information */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* Card 1: Club & Role */}
        <div
          style={{
            background: 'var(--game-surface)',
            border: '1px solid var(--game-line)',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Building size={18} color="var(--game-info)" />
            <span style={{ fontWeight: 800, color: 'var(--game-ink)', fontSize: '0.95rem' }}>
              {t('contract.staff_role_section', 'CLB & Vai Trò Ban Huấn Luyện')}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--game-muted)' }}>{t('contract.club_label', 'Câu Lạc Bộ:')}</span>
              <span style={{ fontWeight: 700, color: 'var(--game-ink)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {clubLogo && <img src={clubLogo} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />}
                <span>{clubName}</span>
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--game-muted)' }}>{t('contract.staff_role_label', 'Vị Trí Đảm Nhiệm:')}</span>
              <RoleBadge role={contract.role || staff.role || staff.staffType} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--game-muted)' }}>{t('contract.squad_type_label', 'Đội Hình Quản Lý:')}</span>
              <span style={{ fontWeight: 700, color: 'var(--game-ink)', fontSize: '0.88rem' }}>
                {contract.squad_type === 'YOUTH_U18' ? t('staff.youth_team', 'Đội trẻ (Youth U18)') : t('staff.first_team', 'Đội một (First Team)')}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--game-muted)' }}>{t('contract.status_label', 'Trạng Thái:')}</span>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: isExpiringSoon ? 'var(--game-gold-soft)' : 'var(--game-accent-soft)',
                  color: isExpiringSoon ? 'var(--game-gold)' : 'var(--game-accent)',
                }}
              >
                {isExpiringSoon ? t('contract.expiring_soon_status', 'Sắp Hết Hạn') : t('contract.active_status', 'Đang Hiệu Lực')}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Financial Terms */}
        <div
          style={{
            background: 'var(--game-surface)',
            border: '1px solid var(--game-line)',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <DollarSign size={18} color="var(--game-gold)" />
            <span style={{ fontWeight: 800, color: 'var(--game-ink)', fontSize: '0.95rem' }}>
              {t('contract.financial_terms_section', 'Đãi Ngộ & Lương Bổng')}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--game-muted)' }}>{t('contract.weekly_wage_label', 'Mức Lương Tuần:')}</span>
              <span style={{ fontWeight: 800, color: 'var(--game-gold)', fontSize: '1.05rem' }}>
                {formatCurrency(wage)} / {t('common.week', 'tuần')}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--game-muted)' }}>{t('contract.annual_cost_est', 'Chi Phí Ước Tính/Mùa:')}</span>
              <span style={{ fontWeight: 700, color: 'var(--game-success)', fontSize: '0.92rem' }}>
                {formatCurrency(wage * 40)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Timeline & Duration */}
        <div
          style={{
            background: 'var(--game-surface)',
            border: '1px solid var(--game-line)',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            gridColumn: '1 / -1',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Calendar size={18} color="var(--game-success)" />
            <span style={{ fontWeight: 800, color: 'var(--game-ink)', fontSize: '0.95rem' }}>
              {t('contract.timeline_section', 'Thời Hạn & Lịch Trình Mùa Giải')}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--game-input)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--game-line)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--game-muted)' }}>{t('contract.start_season_label', 'Mùa giải bắt đầu')}</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--game-text)', marginTop: '2px' }}>
                {t('contract.season_num', 'Mùa {num}').replace('{num}', String(contract.start_season_id || 1))}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--game-dim)', marginTop: '2px' }}>
                {t('common.date', 'Ngày')} {contract.start_season_day || 1}
              </div>
            </div>

            <div style={{ background: 'var(--game-input)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--game-line)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--game-muted)' }}>{t('contract.end_season_label', 'Mùa giải hết hạn')}</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: isExpiringSoon ? 'var(--game-gold)' : 'var(--game-text)', marginTop: '2px' }}>
                {t('contract.season_num', 'Mùa {num}').replace('{num}', String(endSeason))}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--game-dim)', marginTop: '2px' }}>
                {t('common.date', 'Ngày')} {contract.end_season_day || 36}
              </div>
            </div>

            <div style={{ background: isExpiringSoon ? 'var(--game-gold-soft)' : 'var(--game-accent-soft)', padding: '0.85rem', borderRadius: '8px', border: isExpiringSoon ? '1px solid var(--game-gold-line)' : '1px solid var(--game-green-line)' }}>
              <div style={{ fontSize: '0.75rem', color: isExpiringSoon ? 'var(--game-gold)' : 'var(--game-success)' }}>{t('contract.remaining_label', 'Thời gian còn lại')}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: isExpiringSoon ? 'var(--game-gold)' : 'var(--game-success)', marginTop: '2px' }}>
                {remainingSeasons} {t('contract.season_unit', 'mùa')}
              </div>
              <div style={{ fontSize: '0.75rem', color: isExpiringSoon ? 'var(--game-gold)' : 'var(--game-success)', marginTop: '2px' }}>
                {remainingSeasons === 0
                  ? t('contract.expires_end_of_current', 'Đáo hạn cuối mùa này')
                  : t('contract.active_future', 'Có hiệu lực')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Management Actions (Only for Own Staff) */}
      {isCurrentOwnStaff && (
        <div
          style={{
            background: 'var(--game-surface)',
            border: '1px solid var(--game-line)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontWeight: 800, color: 'var(--game-ink)', fontSize: '0.95rem' }}>
              {t('contract.manage_staff_title', 'Thao Tác Hợp Đồng Nhân Sự')}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--game-muted)', marginTop: '2px' }}>
              {isExpiringSoon
                ? t('contract.manage_staff_expiring_note', 'Hợp đồng sắp hết hạn. Bạn có thể gia hạn hoặc sa thải nhân sự.')
                : t('contract.manage_staff_standard_note', 'Sa thải sẽ chấm dứt hợp đồng ngay lập tức, nhân sự sẽ trở thành tự do.')}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Button Gia hạn (chỉ hiện khi còn 1 mùa nữa hết hạn hoặc sắp hết hạn) */}
            {isExpiringSoon && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onOpenRenewModal}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 700,
                }}
              >
                <FileCheck size={16} />
                <span>{t('contract.renew_btn', 'Gia Hạn Hợp Đồng')}</span>
              </button>
            )}

            {/* Button Kết thúc hợp đồng / Sa thải */}
            <button
              type="button"
              className="btn btn-danger"
              onClick={onOpenTerminateModal}
              style={{
                background: 'var(--game-danger-strong)',
                borderColor: 'var(--game-danger)',
                color: 'var(--game-on-color)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 700,
              }}
            >
              <UserMinus size={16} />
              <span>{t('contract.terminate_btn', 'Kết Thúc HĐ / Sa Thải')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
