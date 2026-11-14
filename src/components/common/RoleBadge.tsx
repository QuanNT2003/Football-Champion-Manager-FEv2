import React from 'react';
import { useTranslation } from '../../i18n';

interface Props {
  role: string;
  size?: 'sm' | 'md';
}

export const RoleBadge: React.FC<Props> = ({ role, size = 'md' }) => {
  const { t } = useTranslation();

  const getRoleConfig = (r: string) => {
    switch (r) {
      // 4 Main Staff Types
      case 'COACH':
        return { label: t('staff.type_coach', 'Huấn Luyện Viên'), color: 'var(--game-accent)', bg: 'var(--game-accent-soft)' };
      case 'SCOUT':
        return { label: t('staff.type_scout', 'Tuyển Trạch Viên'), color: 'var(--game-violet)', bg: 'var(--game-violet-soft)' };
      case 'PHYSIO':
        return { label: t('staff.type_physio', 'Bác Sĩ / Trị Liệu'), color: 'var(--game-pink)', bg: 'var(--game-pink-soft)' };
      case 'DIRECTOR':
        return { label: t('staff.type_director', 'Giám Đốc / Quản Lý'), color: 'var(--game-teal)', bg: 'var(--game-teal-soft)' };

      // Contract Roles
      case 'HEAD_COACH':
        return { label: t('staff.head_coach', 'HLV Trưởng'), color: 'var(--game-accent)', bg: 'var(--game-accent-soft)' };
      case 'ASSISTANT_COACH':
        return { label: t('staff.assistant_coach', 'Trợ Lý HLV'), color: 'var(--game-info)', bg: 'var(--game-info-soft)' };
      case 'HEAD_COACH_YOUTH':
        return { label: t('staff.head_coach_youth', 'HLV Trưởng Đội Trẻ U21'), color: 'var(--game-success)', bg: 'var(--game-accent-soft)' };
      case 'ASSISTANT_COACH_YOUTH':
        return { label: t('staff.assistant_coach_youth', 'Trợ Lý HLV Đội Trẻ U21'), color: 'var(--game-info)', bg: 'var(--game-info-soft)' };
      case 'YOUTH_COACH':
        return { label: t('staff.youth_coach', 'HLV Tuyến Trẻ'), color: 'var(--game-teal)', bg: 'var(--game-teal-soft)' };
      case 'FITNESS_COACH':
        return { label: t('staff.fitness_coach', 'HLV Thể Lực'), color: 'var(--game-orange)', bg: 'var(--game-orange-soft)' };
      case 'GOALKEEPING_COACH':
        return { label: t('staff.gk_coach', 'HLV Thủ Môn'), color: 'var(--game-violet)', bg: 'var(--game-violet-soft)' };
      // Scouting Roles
      case 'HEAD_SCOUT':
        return { label: t('staff.head_scout', 'Trưởng Ban Tuyển Trạch'), color: 'var(--game-violet)', bg: 'var(--game-violet-soft)' };
      case 'SCOUT':
        return { label: t('staff.scout', 'Tuyển Trạch Viên'), color: 'var(--game-violet)', bg: 'var(--game-violet-soft)' };

      // Medical Roles
      case 'CHIEF_PHYSIO':
        return { label: t('staff.chief_physio', 'Trưởng Ban Y Tế'), color: 'var(--game-pink)', bg: 'var(--game-pink-soft)' };
      case 'PHYSIO':
        return { label: t('staff.physio', 'Bác Sĩ / Trị Liệu'), color: 'var(--game-pink)', bg: 'var(--game-pink-soft)' };

      // Director Roles
      case 'TECHNICAL_DIRECTOR':
        return { label: t('staff.technical_director', 'Giám Đốc Kỹ Thuật'), color: 'var(--game-teal)', bg: 'var(--game-teal-soft)' };
      case 'SCOUT_DIRECTOR':
        return { label: t('staff.scout_director', 'GĐ Tuyển Trạch'), color: 'var(--game-violet)', bg: 'var(--game-violet-soft)' };
      case 'PHYSIO_DIRECTOR':
        return { label: t('staff.physio_director', 'GĐ Y Tế'), color: 'var(--game-pink)', bg: 'var(--game-pink-soft)' };
      case 'FINANCIAL_DIRECTOR':
        return { label: t('staff.financial_director', 'GĐ Tài Chính'), color: 'var(--game-gold)', bg: 'var(--game-gold-soft)' };
      case 'YOUTH_DIRECTOR':
        return { label: t('staff.youth_director', 'GĐ Đào Tạo Trẻ'), color: 'var(--game-teal)', bg: 'var(--game-teal-soft)' };
      default:
        return { label: r, color: 'var(--game-text)', bg: 'var(--game-raised)' };
    }
  };

  const { label, color, bg } = getRoleConfig(role);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '0.12rem 0.4rem' : '0.2rem 0.55rem',
        borderRadius: '6px',
        fontSize: size === 'sm' ? '0.68rem' : '0.75rem',
        fontWeight: 800,
        color,
        background: bg,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
};
