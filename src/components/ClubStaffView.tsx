import { useTranslation } from '../i18n';
import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Briefcase,
  Star,
  Plus,
  AlertTriangle,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { transfersApi, StaffMarketItem } from '../services/transfers.service';
import { StaffDetailModal } from './staff';
import { StaffAvatar } from './common/StaffAvatar';
import { RoleBadge } from './common/RoleBadge';
import { authApi } from '../services/auth.service';

interface Props {
  clubId: string;
  userClubId?: string;
  cashBalance?: number;
  onNavigateToMarket?: () => void;
}

export const ClubStaffView: React.FC<Props> = ({
  clubId,
  userClubId,
  cashBalance,
  onNavigateToMarket,
}) => {
  const { t } = useTranslation();
  const myUserClubId = userClubId || (authApi.getCurrentClub()?.id ? String(authApi.getCurrentClub()?.id) : undefined);
  const isViewingOwnClub = Boolean(myUserClubId && String(clubId) === String(myUserClubId));

  const [staffList, setStaffList] = useState<StaffMarketItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedStaff, setSelectedStaff] = useState<StaffMarketItem | null>(null);

  const loadClubStaff = async () => {
    if (!clubId) return;
    try {
      setLoading(true);
      const data = await transfersApi.getClubStaff(clubId);
      setStaffList(data || []);
    } catch (err) {
      console.error('Failed to load club staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClubStaff();
  }, [clubId]);

  const formatMoney = (val: number) => {
    if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `€${(val / 1000).toFixed(0)}K`;
    return `€${val.toLocaleString()}`;
  };

  const getLicenseBadge = (license: string) => {
    switch (license) {
      case 'PRO':
        return { text: 'PRO', bg: 'var(--game-gold-strong)', color: 'var(--game-on-color)' };
      case 'A':
        return { text: 'A', bg: 'var(--game-green-strong)', color: 'var(--game-on-color)' };
      case 'B':
        return { text: 'B', bg: 'var(--game-info-strong)', color: 'var(--game-on-color)' };
      case 'C':
        return { text: 'C', bg: 'linear-gradient(135deg, var(--game-line-strong), var(--game-hover))', color: 'var(--game-on-color)' };
      default:
        return { text: license || 'C', bg: 'var(--game-hover)', color: 'var(--game-text)' };
    }
  };

  const renderStars = (reputation: number) => {
    const starCount = Math.min(5, Math.max(1, Math.round(reputation / 2000)));
    return (
      <div style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={12}
            style={{
              color: i <= starCount ? 'var(--game-gold)' : 'var(--game-dim)',
              fill: i <= starCount ? 'var(--game-gold)' : 'none',
            }}
          />
        ))}
      </div>
    );
  };

  // Filtered staff
  const filteredStaff = staffList.filter((s) => {
    if (roleFilter !== 'ALL') {
      const matchRole = s.role === roleFilter;
      const matchType = s.staffType === roleFilter;
      if (!matchRole && !matchType) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchRole = (s.role || '').toLowerCase().includes(q) || s.staffType.toLowerCase().includes(q);
      const matchNat = s.nationality?.toLowerCase().includes(q);
      if (!matchName && !matchRole && !matchNat) return false;
    }
    return true;
  });

  // Calculate telemetry
  const totalWage = staffList.reduce((acc, cur) => acc + (cur.wage || 0), 0);
  const headCoach = staffList.find((s) => s.role === 'HEAD_COACH' || s.staffType === 'HEAD_COACH' || s.staffType === 'COACH') || staffList[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Header Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {/* Total Staff */}
        <div
          style={{
            background: 'var(--game-surface)',
            borderRadius: '14px',
            padding: '1.25rem',
            border: '1px solid var(--game-line)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: 'var(--game-accent-soft)',
              color: 'var(--game-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--game-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              {t('staff.total_members', 'Quy Mô Nhân Sự')}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--game-ink)' }}>
              {staffList.length} <span style={{ fontSize: '0.9rem', color: 'var(--game-muted)', fontWeight: 600 }}>{t('staff.member_unit', 'thành viên')}</span>
            </div>
          </div>
        </div>

        {/* Total Weekly Wages */}
        <div
          style={{
            background: 'var(--game-surface)',
            borderRadius: '14px',
            padding: '1.25rem',
            border: '1px solid var(--game-line)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: 'var(--game-gold-soft)',
              color: 'var(--game-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Briefcase size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--game-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              {t('staff.total_wage_bill', 'Tổng Quỹ Lương Staff')}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--game-success)' }}>
              {formatMoney(totalWage)} <span style={{ fontSize: '0.85rem', color: 'var(--game-muted)', fontWeight: 600 }}>{t('staff.per_week', '/ tuần')}</span>
            </div>
          </div>
        </div>

        {/* Head Coach Status */}
        <div
          style={{
            background: 'var(--game-surface)',
            borderRadius: '14px',
            padding: '1.25rem',
            border: '1px solid var(--game-line)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          {headCoach ? (
            <StaffAvatar
              name={headCoach.name}
              role={headCoach.staffType}
              photoUrl={headCoach.photoUrl || (headCoach as any).photo_url}
              size={48}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: 'var(--game-danger-soft)',
                color: 'var(--game-danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={24} />
            </div>
          )}
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--game-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              {t('staff.current_head_coach', 'HLV Trưởng Hiện Tại')}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: headCoach ? 'var(--game-ink)' : 'var(--game-danger)' }}>
              {headCoach ? headCoach.name : t('staff.no_head_coach', 'Chưa Có HLV Trưởng!')}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Control Bar: Filter, Search, Action */}
      <div
        style={{
          background: 'var(--game-surface)',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          border: '1px solid var(--game-line)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--game-dim)' }} />
            <input
              type="text"
              placeholder={t('staff.search_placeholder', 'Tìm theo tên nhân sự, quốc gia...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.1rem',
                borderRadius: '8px',
                border: '1px solid var(--game-line-strong)',
                fontSize: '0.88rem',
              }}
            />
          </div>

          {/* Role Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={16} color="var(--game-muted)" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--game-line-strong)',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--game-text)',
                background: 'var(--game-surface)',
                maxWidth: '260px',
              }}
            >
              <option value="ALL">{t('staff.role_all', 'Tất cả vai trò & phân loại')}</option>
              <optgroup label={t('staff.category_all', '4 Nhóm Chuyên Môn')}>
                <option value="COACH">{t('staff.type_coach', 'Huấn Luyện Viên (Coach)')}</option>
                <option value="SCOUT">{t('staff.type_scout', 'Tuyển Trạch Viên (Scout)')}</option>
                <option value="PHYSIO">{t('staff.type_physio', 'Bác Sĩ / Trị Liệu (Physio)')}</option>
                <option value="DIRECTOR">{t('staff.type_director', 'Giám Đốc / Quản Lý (Director)')}</option>
              </optgroup>
              <optgroup label={t('staff.optgroup_coaching', 'Ban Huấn Luyện Đội Một (First Team)')}>
                <option value="HEAD_COACH">{t('staff.head_coach', 'HLV Trưởng')}</option>
                <option value="ASSISTANT_COACH">{t('staff.assistant_coach', 'Trợ Lý HLV')}</option>
                <option value="FITNESS_COACH">{t('staff.fitness_coach', 'HLV Thể Lực')}</option>
                <option value="GOALKEEPING_COACH">{t('staff.gk_coach', 'HLV Thủ Môn')}</option>
              </optgroup>
              <optgroup label={t('staff.optgroup_youth_team', 'Đội Trẻ U21 & Học Viện (Youth Team)')}>
                <option value="HEAD_COACH_YOUTH">{t('staff.head_coach_youth', 'HLV Trưởng Đội Trẻ U21')}</option>
                <option value="ASSISTANT_COACH_YOUTH">{t('staff.assistant_coach_youth', 'Trợ Lý HLV Đội Trẻ U21')}</option>
                <option value="YOUTH_DIRECTOR">{t('staff.youth_director', 'Giám Đốc Đào Tạo Trẻ')}</option>
              </optgroup>
              <optgroup label={t('staff.optgroup_scouting', 'Tuyển Trạch (Scouting)')}>
                <option value="HEAD_SCOUT">{t('staff.head_scout', 'Trưởng Ban Tuyển Trạch')}</option>
                <option value="SCOUT">{t('staff.scout', 'Tuyển Trạch Viên')}</option>
              </optgroup>
              <optgroup label={t('staff.optgroup_medical', 'Y Tế & Thể Trạng (Medical)')}>
                <option value="CHIEF_PHYSIO">{t('staff.chief_physio', 'Trưởng Ban Y Tế')}</option>
                <option value="PHYSIO">{t('staff.physio', 'Bác Sĩ / Trị Liệu')}</option>
              </optgroup>
              <optgroup label={t('staff.optgroup_director', 'Ban Giám Đốc (Board & Directors)')}>
                <option value="TECHNICAL_DIRECTOR">{t('staff.technical_director', 'Giám Đốc Kỹ Thuật')}</option>
                <option value="SCOUT_DIRECTOR">{t('staff.scout_director', 'Giám Đốc Tuyển Trạch')}</option>
                <option value="PHYSIO_DIRECTOR">{t('staff.physio_director', 'Giám Đốc Y Tế')}</option>
                <option value="FINANCIAL_DIRECTOR">{t('staff.financial_director', 'Giám Đốc Tài Chính')}</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Nút Tuyển thêm nhân sự (chỉ khi là CLB của mình) */}
        {isViewingOwnClub && onNavigateToMarket && (
          <button
            type="button"
            onClick={onNavigateToMarket}
            className="btn btn-sm btn-primary flex-center"
            style={{
              padding: '0.55rem 1.15rem',
              fontWeight: 800,
              gap: '0.45rem',
              borderRadius: '8px',
              boxShadow: '0 2px 6px rgba(22, 163, 74, 0.2)',
            }}
          >
            <Plus size={16} />
            <span>{t('staff.hire_more_btn', 'Tuyển Thêm Nhân Sự')}</span>
          </button>
        )}
      </div>

      {/* 3. Danh sách thẻ nhân sự trong CLB */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--game-surface)', borderRadius: '14px', border: '1px solid var(--game-line)' }}>
          <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 1rem' }} />
          <div style={{ color: 'var(--game-muted)' }}>{t('staff.loading_club_staff', 'Đang nạp dữ liệu ban huấn luyện CLB...')}</div>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--game-surface)', borderRadius: '14px', border: '1px solid var(--game-line)' }}>
          <Users size={48} color="var(--game-dim)" style={{ margin: '0 auto 1rem' }} />
          <h4 style={{ margin: '0 0 0.5rem', fontWeight: 800, color: 'var(--game-ink)' }}>
            {t('staff.empty_club_staff', 'Chưa Có Nhân Sự Nào')}
          </h4>
          <p style={{ margin: 0, color: 'var(--game-muted)', fontSize: '0.9rem' }}>
            {t('staff.empty_club_staff_desc', 'Hãy ghé qua Thị trường Tuyển mộ để ký hợp đồng với những chuyên gia bóng đá hàng đầu.')}
          </p>
          {onNavigateToMarket && (
            <button
              type="button"
              onClick={onNavigateToMarket}
              className="btn btn-primary"
              style={{ marginTop: '1.25rem', padding: '0.55rem 1.25rem', fontWeight: 800 }}
            >
              {t('staff.go_to_market_btn', 'Đến Thị Trường Tuyển Mộ')}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredStaff.map((st) => {
            const licenseBadge = getLicenseBadge(st.coachingLicense);
            const styleKey = st.tacticalStyle ? st.tacticalStyle.toLowerCase() : '';
            const styleLabel = styleKey ? t(`staff.style_${styleKey}`, st.tacticalStyle) : (st.tacticalStyle || 'BALANCED');
            const staffOvr = st.ovr || st.overall_rating || 60;
            const ovrColor = staffOvr >= 65 ? 'var(--game-success)' : staffOvr >= 55 ? 'var(--game-info)' : 'var(--game-muted)';
            const ovrBg = staffOvr >= 65 ? 'rgba(16, 185, 129, 0.12)' : staffOvr >= 55 ? 'rgba(2, 132, 199, 0.12)' : 'rgba(100, 116, 139, 0.12)';

            return (
              <div
                key={st.id}
                onClick={() => setSelectedStaff(st)}
                style={{
                  background: 'var(--game-surface)',
                  borderRadius: '14px',
                  border: '1px solid var(--game-line)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = 'var(--game-line-active)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.03)';
                  e.currentTarget.style.borderColor = 'var(--game-line)';
                }}
              >
                {/* Header: Avatar, Name, License, Role */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ position: 'relative' }}>
                    <StaffAvatar
                      name={st.name}
                      role={st.role || st.staffType}
                      photoUrl={st.photoUrl || (st as any).photo_url}
                      size={52}
                      style={{ borderRadius: '12px' }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        bottom: -4,
                        right: -4,
                        background: licenseBadge.bg,
                        color: licenseBadge.color,
                        fontSize: '0.62rem',
                        fontWeight: 900,
                        padding: '0.1rem 0.35rem',
                        borderRadius: '4px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }}
                    >
                      {licenseBadge.text}
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: '0.96rem',
                          color: 'var(--game-ink)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {st.name}
                      </div>
                      <span
                        className="ovr-chip"
                        style={{
                          background: ovrBg,
                          color: ovrColor,
                          border: `1px solid ${ovrColor}`,
                          fontWeight: 900,
                          fontSize: '0.8rem',
                          padding: '1px 6px',
                          borderRadius: '5px',
                        }}
                      >
                        {staffOvr}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                      <RoleBadge role={st.role || st.staffType} size="sm" />

                      <span style={{ fontSize: '0.74rem', color: 'var(--game-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {st.age && <span>{t('staff.age_format', '{age} tuổi').replace('{age}', String(st.age))}</span>}
                        {st.countryFlag && <img src={st.countryFlag} alt="" style={{ width: 14, height: 10, borderRadius: 2 }} />}
                        <span>{st.countryCode || st.nationality}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body Specs */}
                <div
                  style={{
                    background: 'var(--game-input)',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.82rem',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--game-muted)' }}>{t('staff.philosophy_label', 'Triết lý:')} </span>
                    <strong style={{ color: 'var(--game-accent)' }}>{styleLabel}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--game-muted)' }}>{t('staff.formation_label', 'Sơ đồ:')} </span>
                    <strong style={{ color: 'var(--game-ink)' }}>{st.preferredFormation?.name || '4-3-3'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--game-muted)' }}>{t('staff.weekly_wage_label', 'Lương tuần:')} </span>
                    <strong style={{ color: 'var(--game-gold)' }}>{formatMoney(st.wage)}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ color: 'var(--game-muted)' }}>{t('staff.reputation_label', 'Danh tiếng:')} </span>
                    {renderStars(st.reputation)}
                  </div>
                </div>

                {/* Footer Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--game-muted)', paddingTop: '0.25rem' }}>
                  <span style={{ color: 'var(--game-accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <UserCheck size={14} /> {t('staff.official_contract', 'Hợp đồng chính thức')}
                  </span>
                  <span style={{ color: 'var(--game-info)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    {t('staff.view_profile', 'Xem hồ sơ')} <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. MODAL CHI TIẾT NHÂN SỰ KHI CLICK VÀO ITEM */}
      {selectedStaff && (
        <StaffDetailModal
          staff={selectedStaff}
          staffList={staffList}
          currentClubId={myUserClubId}
          cashBalance={cashBalance}
          onClose={() => setSelectedStaff(null)}
          onSelectStaff={(st) => setSelectedStaff(st)}
          onOfferSuccess={() => {
            loadClubStaff();
          }}
        />
      )}
    </div>
  );
};
