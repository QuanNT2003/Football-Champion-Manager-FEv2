import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Building2, ChartNoAxesCombined, Check, Clock3, Dumbbell, GraduationCap, Hammer, Loader2, MapPin, ShieldCheck, Stethoscope, Store, Users } from 'lucide-react';
import type { Club, UpgradeTiming } from '../types';
import { useTranslation } from '../i18n';
import { facilityImageUrl, normalizeFacilityCode } from '../utils/facilities';
import './FacilitiesView.css';
import { ConfirmModal } from './common/ConfirmModal';

interface Props {
  club: Club | null;
  onUpgradeFacility: (facilityId: string) => Promise<void> | void;
  onUpgradeStadium?: () => Promise<void> | void;
  onRefresh?: () => Promise<void> | void;
}

const facilityMeta = {
  TRAINING_GROUND: { icon: Dumbbell, key: 'training', tone: 'green' },
  YOUTH_ACADEMY: { icon: GraduationCap, key: 'youth', tone: 'teal' },
  MEDICAL_CENTRE: { icon: Stethoscope, key: 'medical', tone: 'rose' },
  DATA_ANALYTICS: { icon: ChartNoAxesCombined, key: 'analytics', tone: 'blue' },
  COMMERCIAL_OFFICE: { icon: Store, key: 'commercial', tone: 'gold' },
  STADIUM: { icon: Building2, key: 'stadium', tone: 'green' },
} as const;

function FacilityImage({ src, fallback, name, eager = false }: { src?: string; fallback?: string; name: string; eager?: boolean }) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const current = [src, fallback].find(source => source && !failedSources.includes(source));
  return current
    ? <img src={current} alt={name} loading={eager ? 'eager' : 'lazy'} onError={() => setFailedSources(previous => [...previous, current])} />
    : <div className="infrastructure-image-fallback" role="img" aria-label={name}><Building2 size={52} strokeWidth={1} /></div>;
}

export function FacilitiesView({ club, onUpgradeFacility, onUpgradeStadium, onRefresh }: Props) {
  const { t, language } = useTranslation();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const upgradeLock = useRef(false);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const facilities = club?.facilities ?? club?.club_facilities ?? [];
  const stadium = club?.stadium ?? club?.stadiums?.[0];
  const activeStadium = stadium?.active_upgrade;
  const activeFacility = facilities.find(f => f.active_upgrade || ['UPGRADING', 'UNDER_CONSTRUCTION'].includes(f.status));
  const hasActiveUpgrade = Boolean(activeFacility || activeStadium);
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    if (!hasActiveUpgrade) return;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [hasActiveUpgrade]);
  useEffect(() => {
    if (!hasActiveUpgrade || !onRefresh) return;
    const refresh = () => { if (document.visibilityState === 'visible') void onRefresh(); };
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [club?.id, hasActiveUpgrade, onRefresh]);

  if (!club) return <div className="game-empty-state">
    <Building2 size={48} className="empty-icon" /><h3>{t('common.no_data')}</h3><p>{t('facilities.no_club_prompt')}</p>
  </div>;

  const stadiumFacility = facilities.find(f => normalizeFacilityCode(f.code) === 'STADIUM');
  const stadiumImage = facilityImageUrl('STADIUM', stadium?.completed_expansions != null ? stadium.completed_expansions + 1 : stadiumFacility?.current_level ?? 1);
  const cash = club.financial_accounts?.[0]?.cash_balance ?? club.finances?.cash;
  const locale = language === 'vi' ? 'vi-VN' : 'en-GB';
  const number = (value: number) => Number(value).toLocaleString(locale);
  const money = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  const remainingTime = (upgrade: UpgradeTiming & { days_remaining: number }) => {
    const deadline = upgrade.completes_at ? Date.parse(upgrade.completes_at) : NaN;
    const seconds = Number.isFinite(deadline) ? Math.max(0, Math.ceil((deadline - clock) / 1000)) : upgrade.remaining_seconds ?? upgrade.days_remaining * 86400;
    if (seconds === 0) return t('facilities.finalizing');
    const time = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(value => String(value).padStart(2, '0')).join(':');
    return t('facilities.remaining_time', { time });
  };
  const completionTime = (upgrade: UpgradeTiming) => upgrade.completes_at
    ? t('facilities.completes_at', { time: new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(upgrade.completes_at)) }) : '';
  const totalFacilities = facilities.length + (stadium ? 1 : 0);
  const operational = facilities.filter(f => !f.status || ['OPERATIONAL', 'ACTIVE'].includes(f.status)).length + (stadium && !activeStadium ? 1 : 0);
  const stadiumName = stadium?.name || `${club.name} Arena`;
  const location = [stadium?.city || club.city, club.country_detail?.name || club.country].filter(Boolean).join(', ');
  const facilityName = (facility: typeof facilities[number]) => {
    const meta = facilityMeta[normalizeFacilityCode(facility.code) as keyof typeof facilityMeta];
    return meta ? t(`facilities.type_${meta.key}`) : facility.name;
  };
  const confirming = facilities.find(f => f.id === confirmId);
  const stadiumCost = stadium?.upgrade_cost;
  const stadiumInsufficientCash = cash != null && stadiumCost != null && Number(cash) < stadiumCost;

  const upgrade = async (id: string) => {
    if (upgradeLock.current || hasActiveUpgrade) return;
    upgradeLock.current = true;
    setPendingId(id);
    setError('');
    try { if (id === 'stadium') await onUpgradeStadium?.(); else await onUpgradeFacility(id); }
    catch (err) { setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || t('app.upgrade_failed')); }
    finally { upgradeLock.current = false; setPendingId(null); setConfirmId(null); }
  };

  return <div className="view-container infrastructure-page">
    <section className="infrastructure-hero" aria-labelledby="infrastructure-stadium-name">
      <div className="infrastructure-hero-image"><FacilityImage key={stadiumImage} src={stadiumImage} fallback={club.stadium?.image_url ?? undefined} name={stadiumName} eager /></div>
      <div className="infrastructure-hero-content">
        <span className="infrastructure-eyebrow"><ShieldCheck size={15} />{t('facilities.stadium')}</span>
        <h2 id="infrastructure-stadium-name">{stadiumName}</h2>
        {location && <p className="infrastructure-location"><MapPin size={14} />{location}</p>}
        <p className="infrastructure-hero-description">{t('facilities.stadium_desc')}</p>
        <div className="infrastructure-capacity"><Users size={21} /><div>
          <span>{t('facilities.capacity')}</span>
          <strong>{stadium?.capacity != null ? number(stadium.capacity) : '—'} <small>{t('facilities.seats')}</small></strong>
        </div></div>
        {stadium && <div className="infrastructure-stadium-expansion">
          <div><span>{activeStadium ? t('facilities.paid_cost') : t('facilities.upgrade_cost')}</span>
            <strong>{activeStadium ? money(activeStadium.cost) : stadiumCost != null ? money(stadiumCost) : t('facilities.price_unavailable')}</strong></div>
          <div><span>{activeStadium ? remainingTime(activeStadium) : t('facilities.duration_hours', { hours: 48 })}</span>
            <strong>{t('facilities.stadium_add_seats', { count: number(stadium.capacity_increment ?? 5000) })}</strong></div>
          <button type="button" className="infrastructure-upgrade" disabled={!onUpgradeStadium || hasActiveUpgrade || pendingId !== null || stadiumCost == null || stadiumInsufficientCash}
            title={hasActiveUpgrade ? t('facilities.queue_locked') : stadiumInsufficientCash ? t('facilities.not_enough_cash') : undefined}
            onClick={() => { setError(''); setConfirmId('stadium'); }}>
            <Hammer size={16} />{activeStadium ? t('facilities.construction') : hasActiveUpgrade ? t('facilities.wait_construction') : t('facilities.expand_stadium')}
          </button>
          <p>{t('facilities.stadium_capacity_change', { from: number(stadium.capacity), to: number(activeStadium?.to_capacity ?? stadium.next_capacity ?? stadium.capacity + 5000) })}</p>
          {activeStadium?.completes_at && <p>{completionTime(activeStadium)}</p>}
        </div>}
      </div>
      <span className="infrastructure-hero-caption">{club.name}</span>
    </section>

    <div className="infrastructure-overview">
      <div><span>{t('finances.cash_balance')}</span><strong className="infrastructure-cash">{cash != null ? money(cash) : '—'}</strong></div>
      <div><span>{t('facilities.total')}</span><strong>{number(totalFacilities)} <small>{t('facilities.items')}</small></strong></div>
      <div><span>{t('facilities.status_operating')}</span><strong><i />{operational}<small> / {totalFacilities}</small></strong></div>
    </div>

    <header className="infrastructure-heading"><div>
      <span className="infrastructure-eyebrow">{t('facilities.development')}</span>
      <h3>{t('facilities.title')}</h3><p>{t('facilities.subtitle')}</p>
    </div><span className="infrastructure-count"><Building2 size={15} />{facilities.length} {t('facilities.items')}</span></header>
    <p className="infrastructure-construction-rule"><Clock3 size={15} />{t('facilities.construction_rule')}</p>
    {(activeFacility || activeStadium) && <div className="infrastructure-construction-banner" role="status"><Hammer size={22} /><div>
      <strong>{t('facilities.active_construction', { name: activeStadium ? t('facilities.type_stadium') : facilityName(activeFacility!) })}</strong>
      <p>{activeStadium || activeFacility?.active_upgrade ? remainingTime(activeStadium || activeFacility!.active_upgrade!) : t('facilities.upgrading')} · {t('facilities.queue_locked')}</p>
    </div></div>}
    {error && <p className="infrastructure-error" role="alert">{error}</p>}
    {!facilities.length ? <div className="infrastructure-empty"><Building2 size={36} strokeWidth={1.2} /><h4>{t('facilities.empty_title')}</h4><p>{t('facilities.empty_description')}</p></div>
      : <div className="infrastructure-grid">{facilities.map(facility => {
        const code = normalizeFacilityCode(facility.code);
        const meta = facilityMeta[code as keyof typeof facilityMeta];
        const Icon = meta?.icon ?? Building2;
        const name = facilityName(facility);
        const maxLevel = facility.max_level ?? 10;
        const level = Math.max(1, Number(facility.current_level) || 1);
        const maxed = level >= maxLevel;
        const isUpgrading = Boolean(facility.active_upgrade) || ['UPGRADING', 'UNDER_CONSTRUCTION'].includes(facility.status);
        const blocked = hasActiveUpgrade && !isUpgrading;
        const busy = pendingId === facility.id;
        const insufficientCash = facility.upgrade_cost != null && cash != null && Number(cash) < Number(facility.upgrade_cost);
        const image = facilityImageUrl(code, level);
        const status = isUpgrading ? t('facilities.upgrading')
          : !facility.status || ['OPERATIONAL', 'ACTIVE'].includes(facility.status) ? t('facilities.status_operating')
          : t(`facilities.status_${facility.status.toLowerCase()}`, t('facilities.status_unavailable'));

        return <article className={`infrastructure-card tone-${meta?.tone ?? 'green'}`} key={facility.id} aria-labelledby={`facility-${facility.id}`}>
          <div className="infrastructure-card-image">
            <FacilityImage key={image} src={image} name={t('facilities.image_alt', { name, level })} />
            <span className="infrastructure-level">{t('common.level')} <strong>{level.toString().padStart(2, '0')}</strong><small>/ {maxLevel}</small></span>
            <span className={`infrastructure-status ${isUpgrading ? 'is-upgrading' : ''}`}><i />{status}</span>
          </div>
          <div className="infrastructure-card-body">
            <header><span className="infrastructure-card-icon"><Icon size={21} strokeWidth={1.7} /></span><h4 id={`facility-${facility.id}`}>{name}</h4></header>
            <p>{meta ? t(`facilities.card_desc_${meta.key}`) : t('facilities.card_desc_generic')}</p>
            <div className="infrastructure-duration"><Clock3 size={13} />{isUpgrading && facility.active_upgrade
              ? remainingTime(facility.active_upgrade)
              : t('facilities.duration_hours', { hours: 48 })}
              {facility.active_upgrade && <strong>→ {t('common.level')} {facility.active_upgrade.target_level}</strong>}</div>
            {facility.active_upgrade?.completes_at && <p className="infrastructure-completion-time">{completionTime(facility.active_upgrade)}</p>}
            <div className="infrastructure-progress-label"><span>{t('facilities.development_level')}</span><strong>{level}<small> / {maxLevel}</small></strong></div>
            <div className="infrastructure-progress" role="progressbar" aria-label={t('facilities.development_level')} aria-valuemin={0} aria-valuemax={maxLevel} aria-valuenow={Math.min(level, maxLevel)}>
              {Array.from({ length: maxLevel }, (_, index) => <span key={index} className={index < level ? 'is-filled' : ''} />)}
            </div>
          </div>
          <footer className="infrastructure-card-footer">
            <span className="infrastructure-next-level">{maxed ? <><Check size={15} />{t('facilities.max_level')}</>
              : facility.active_upgrade ? <><span>{t('facilities.paid_cost')}</span><strong>{money(facility.active_upgrade.cost)}</strong></>
              : facility.upgrade_cost != null ? <><span>{t('facilities.upgrade_cost')}</span><strong>{money(facility.upgrade_cost)}</strong></>
              : <><span>{t('facilities.upgrade_cost')}</span><strong>{t('facilities.price_unavailable')}</strong></>}
            </span>
            <button type="button" className="infrastructure-upgrade" disabled={maxed || isUpgrading || blocked || pendingId !== null || insufficientCash || facility.upgrade_cost == null}
              aria-label={t('facilities.upgrade_named', { name })} aria-busy={busy}
              title={blocked ? t('facilities.queue_locked') : insufficientCash ? t('facilities.not_enough_cash') : undefined} onClick={() => { setError(''); setConfirmId(facility.id); }}>
              {busy ? <Loader2 size={16} className="infrastructure-spin" /> : maxed ? <Check size={16} /> : <Hammer size={16} />}
              {busy ? t('facilities.processing') : maxed ? t('facilities.completed') : isUpgrading ? t('facilities.construction') : blocked ? t('facilities.wait_construction') : t('facilities.upgrade_short')}
              {!maxed && !busy && !isUpgrading && <ArrowUpRight size={15} />}
            </button>
          </footer>
        </article>;
      })}</div>}
    <ConfirmModal isOpen={confirmId === 'stadium' && Boolean(stadium)} title={t('facilities.expand_stadium')} confirmText={t('facilities.start_construction')}
      isLoading={pendingId !== null} icon={<Hammer size={24} />} onClose={() => setConfirmId(null)}
      onConfirm={() => { if (stadiumCost != null && onUpgradeStadium && !hasActiveUpgrade) void upgrade('stadium'); }}
      message={stadium && <div className="infrastructure-confirm"><strong>{stadiumName}</strong>
        <p>{t('facilities.stadium_capacity_change', { from: number(stadium.capacity), to: number(stadium.next_capacity ?? stadium.capacity + 5000) })}</p>
        <p>{t('facilities.upgrade_cost')}: <b>{stadiumCost != null ? money(stadiumCost) : '—'}</b></p>
        <p>{t('facilities.duration_hours', { hours: 48 })}</p><p>{t('facilities.stadium_confirm_charge')}</p>
      </div>} />
    <ConfirmModal isOpen={Boolean(confirming)} title={t('facilities.confirm_title')} confirmText={t('facilities.start_construction')}
      isLoading={pendingId !== null} icon={<Hammer size={24} />} onClose={() => setConfirmId(null)}
      onConfirm={() => { if (confirming && !hasActiveUpgrade && confirming.upgrade_cost != null) void upgrade(confirming.id); }}
      message={confirming && <div className="infrastructure-confirm"><strong>{facilityName(confirming)} · {t('common.level')} {confirming.current_level + 1}</strong>
        <p>{t('facilities.upgrade_cost')}: <b>{confirming.upgrade_cost != null ? money(confirming.upgrade_cost) : '—'}</b></p>
        <p>{t('facilities.duration_hours', { hours: 48 })}</p><p>{t('facilities.confirm_charge')}</p>
      </div>} />
  </div>;
}
