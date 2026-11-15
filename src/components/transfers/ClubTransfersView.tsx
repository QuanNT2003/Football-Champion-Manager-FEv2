import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, BriefcaseBusiness, CalendarDays, Shirt } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { clubsApi } from '../../services/clubs.service';
import { StaffMarketItem, TransferStaffSummary, transfersApi } from '../../services/transfers.service';
import { Player, TimelineData, TransferOffer } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import { RoleBadge } from '../common/RoleBadge';
import { PlayerDetailModal } from '../player';
import { StaffDetailModal } from '../staff';
import { ClubTransferDirection, TransferCard, TransferHistoryRow, TransferOfferAction, TransferPerson } from './ClubTransferDirection';

interface ClubTransfersViewProps {
  currentClubId: string;
  cashBalance: number;
  players: Player[];
  season?: TimelineData['season'];
  onRefreshFinance: () => void;
}

const tabs = [
  { id: 'players', icon: Shirt, label: 'club_transfers.players' },
  { id: 'staff', icon: BriefcaseBusiness, label: 'club_transfers.staff' },
] as const;
const directions = [
  { id: 'arrivals', icon: ArrowDownLeft, label: 'club_transfers.arrivals' },
  { id: 'departures', icon: ArrowUpRight, label: 'club_transfers.departures' },
] as const;

function transferPath(tab: TransferPerson['kind'], direction: 'arrivals' | 'departures') {
  const query = new URLSearchParams();
  if (tab === 'staff') query.set('tab', tab);
  if (direction === 'departures') query.set('direction', direction);
  return query.size ? `/club/transfers?${query}` : '/club/transfers';
}

type TransferData =
  | { tab: 'players'; offers: Awaited<ReturnType<typeof transfersApi.getClubOffers>>; history: Awaited<ReturnType<typeof clubsApi.getTransfers>> }
  | { tab: 'staff'; data: Awaited<ReturnType<typeof transfersApi.getClubStaffTransfers>> };

async function loadTransfers(clubId: string, tab: TransferPerson['kind']): Promise<TransferData> {
  if (tab === 'staff') return { tab, data: await transfersApi.getClubStaffTransfers(clubId) };
  const [offers, history] = await Promise.all([transfersApi.getClubOffers(clubId), clubsApi.getTransfers(clubId)]);
  return { tab, offers, history };
}

function staffPerson(staff: TransferStaffSummary): TransferPerson {
  return {
    id: staff.id, kind: 'staff', name: staff.name, photo: staff.photo_url, role: staff.staff_type,
    license: staff.coaching_license, age: staff.age, rating: staff.ovr,
  };
}

export function ClubTransfersView({ currentClubId, cashBalance, players, season, onRefreshFinance }: ClubTransfersViewProps) {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const tab = params.get('tab') === 'staff' ? 'staff' : 'players';
  const direction = params.get('direction') === 'departures' ? 'departures' : 'arrivals';
  const arriving = direction === 'arrivals';
  const [revision, setRevision] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMarketItem | null>(null);
  const [action, setAction] = useState<TransferOfferAction | null>(null);
  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState('');
  const [loaded, setLoaded] = useState<{ clubId: string; tab: typeof tab; data: TransferData | null; revision: number } | null>(null);
  const result = loaded?.clubId === currentClubId && loaded.tab === tab ? loaded : null;
  const data = result?.data;
  const cards = new Map<string, TransferCard>();
  let history: TransferHistoryRow[] = [];

  useEffect(() => {
    let active = true;
    loadTransfers(currentClubId, tab).then(data => {
      if (active) setLoaded({ clubId: currentClubId, tab, data, revision });
    }).catch(() => {
      if (active) setLoaded({ clubId: currentClubId, tab, data: null, revision });
    });
    return () => { active = false; };
  }, [currentClubId, tab, revision]);

  function refreshAfterChange() {
    onRefreshFinance();
    setRevision(value => value + 1);
  }

  function playerActions(offer: TransferOffer): TransferOfferAction[] {
    if (arriving) return [{
      label: t('club_transfers.cancel_offer'),
      message: t('bids.confirm_cancel'),
      variant: 'danger',
      run: () => transfersApi.cancelOffer(offer.id, currentClubId),
    }];
    return [{
      label: t('club_transfers.accept_offer'),
      message: t('bids.confirm_accept'),
      variant: 'success',
      run: () => transfersApi.respondOffer(offer.id, { response: 'ACCEPTED', clubId: currentClubId }),
    }, {
      label: t('club_transfers.reject_offer'),
      message: t('bids.confirm_reject'),
      variant: 'danger',
      run: () => transfersApi.respondOffer(offer.id, { response: 'REJECTED', clubId: currentClubId }),
    }];
  }

  if (data?.tab === 'players') {
    if (!arriving) {
      for (const player of players) {
        const status = player.status ?? player.player_status;
        const listingLabels = [
          ...(status?.is_transfer_listed ? [t('transfers.status_transfer')] : []),
          ...(status?.is_loan_listed ? [t('transfers.status_loan')] : []),
        ];
        if (listingLabels.length === 0) continue;

        cards.set(player.id, {
          person: {
            id: player.id, kind: 'players', name: player.common_name || player.name || `${player.first_name} ${player.last_name}`.trim(),
            position: player.position?.code, photo: player.photo_url, age: player.age,
            rating: player.ovr ?? player.overall_rating,
          },
          listingLabels,
          openProfile: () => setSelectedPlayer({ ...player, club_id: currentClubId }),
          offers: [],
        });
      }
    }

    for (const offer of data.offers[arriving ? 'outgoing' : 'incoming']) {
      if (offer.status !== 'PENDING') continue;
      const player = offer.player;
      const name = player?.common_name || [player?.first_name, player?.last_name].filter(Boolean).join(' ') || offer.player_id;
      const person: TransferPerson = {
        id: offer.player_id, kind: 'players', name, position: player?.position, photo: player?.photo_url,
        age: player?.age, rating: player?.ovr,
      };
      const card = cards.get(person.id) ?? {
        person,
        openProfile: player ? () => {
          const { position, photo_url, ...details } = player;
          setSelectedPlayer({
            ...details,
            position: position ? { code: position, name: position } : undefined,
            photo_url: photo_url ?? undefined,
            club_id: player.club_id ?? offer.to_club_id,
          });
        } : undefined,
        offers: [],
      };
      card.offers.push({
        id: offer.id,
        club: (arriving ? offer.seller_club ?? offer.to_club : offer.buyer_club ?? offer.from_club)?.name ?? '—',
        season: offer.season_number,
        day: offer.season_day,
        terms: [
          { label: t('club_detail.contract_type'), value: t(offer.is_loan ? 'club_detail.loan_type' : 'club_detail.buy_type') },
          { label: t('club_detail.transfer_fee'), value: formatCurrency(offer.offer_amount, offer.currency_type === 'GOLD' ? '🪙' : '€') },
          { label: t('club_transfers.weekly_wage'), value: formatCurrency(offer.proposed_wage) },
          { label: t('club_transfers.duration'), value: t('club_transfers.years', { count: offer.contract_years ?? 0 }) },
        ],
        actions: playerActions(offer),
      });
      cards.set(person.id, card);
    }
    history = data.history[direction].map(row => ({
      id: row.id,
      person: {
        id: row.player.id, kind: 'players', name: row.player.name, position: row.player.position,
        photo: row.player.photo_url, age: row.player.age, rating: row.player.ovr,
      },
      club: row.other_club.name,
      season: row.season_number,
      day: row.season_day,
      type: t(row.is_loan ? 'club_detail.loan_type' : 'club_detail.buy_type'),
      amount: formatCurrency(row.transfer_fee, row.currency_type === 'GOLD' ? '🪙' : '€'),
    }));
  }

  if (data?.tab === 'staff') {
    for (const offer of data.data[direction].offers) {
      const person = staffPerson(offer.staff);
      const card = cards.get(person.id) ?? {
        person,
        openProfile: () => setSelectedStaff({
          id: person.id, name: person.name, staffType: offer.staff.staff_type,
          photoUrl: person.photo ?? undefined, coachingLicense: offer.staff.coaching_license,
          reputation: 0, ovr: person.rating, age: person.age, tacticalStyle: '', nationality: '', countryCode: '',
          wage: offer.wage, signingFee: offer.bonus,
        }),
        offers: [],
      };
      card.offers.push({
        id: offer.id,
        club: offer.club?.name ?? t('club_transfers.free_agent'),
        season: offer.season_number,
        day: offer.season_day,
        terms: [
          { label: t('club_transfers.role'), value: <RoleBadge role={offer.role} size="sm" /> },
          { label: t('club_transfers.weekly_wage'), value: formatCurrency(offer.wage) },
          { label: t('club_transfers.signing_bonus'), value: formatCurrency(offer.bonus) },
          { label: t('club_transfers.duration'), value: t('club_transfers.years', { count: offer.years }) },
          ...(offer.compensation > 0 ? [{ label: t('club_transfers.compensation'), value: formatCurrency(offer.compensation) }] : []),
        ],
        actions: arriving ? [{
          label: t('club_transfers.cancel_offer'),
          message: t('club_transfers.confirm_cancel_staff'),
          variant: 'danger',
          run: () => transfersApi.cancelStaffOffer(offer.id, currentClubId),
        }] : [],
      });
      cards.set(person.id, card);
    }
    history = data.data[direction].history.map(row => ({
      id: row.id,
      person: { ...staffPerson(row.staff), role: row.role },
      season: row.season_number,
      day: row.season_day,
      type: arriving ? t('club_transfers.signed')
        : t(row.status === 'EXPIRED' ? 'club_transfers.expired' : 'club_transfers.ended'),
      amount: formatCurrency(row.wage),
    }));
  }

  async function confirmAction() {
    if (!action || working) return;
    setWorking(true);
    setActionError('');
    try {
      await action.run();
      setAction(null);
    } catch (error: any) {
      setActionError(error?.response?.data?.message || error?.message || t('common.error'));
    } finally {
      refreshAfterChange();
      setWorking(false);
    }
  }

  return (
    <div className="club-transfers">
      <header className="club-transfers-header">
        <div className="club-transfers-title">
          <span><ArrowLeftRight aria-hidden="true" size={24} /></span>
          <h1>{t('v2.transfers')}</h1>
        </div>
        {season && (
          <span className="club-transfers-season">
            <CalendarDays aria-hidden="true" size={15} />
            {t('club_transfers.game_day', { season: season.season_number, day: season.current_day })}
          </span>
        )}
      </header>
      <div className="club-transfer-controls">
        <nav className="club-transfer-tabs" aria-label={t('v2.transfers')}>
          {tabs.map(({ id, icon: Icon, label }) => (
            <Link key={id} to={transferPath(id, direction)} aria-current={tab === id ? 'page' : undefined}>
              <Icon size={18} />{t(label)}
            </Link>
          ))}
        </nav>
        <nav className="club-transfer-directions" aria-label={t('club_transfers.direction')}>
          {directions.map(({ id, icon: Icon, label }) => (
            <Link key={id} to={transferPath(tab, id)} aria-current={direction === id ? 'page' : undefined}>
              <Icon size={16} />{t(label)}
            </Link>
          ))}
        </nav>
      </div>
      {result && !data && result.revision === revision && (
        <div className="club-transfer-error" role="alert">
          {t('club_transfers.load_error')}
          <button type="button" className="btn btn-xs btn-secondary" onClick={() => setRevision(value => value + 1)}>{t('club_transfers.retry')}</button>
        </div>
      )}
      <ClubTransferDirection
        direction={direction} kind={tab} cards={data ? Array.from(cards.values()) : null}
        history={data ? history : null} loading={!result || (!data && result.revision !== revision)}
        onAction={nextAction => { setActionError(''); setAction(nextAction); }}
      />
      {selectedPlayer && (
        <PlayerDetailModal player={selectedPlayer} currentClubId={currentClubId} cashBalance={cashBalance}
          initialTab={arriving ? 'offer' : 'skills'} onClose={() => setSelectedPlayer(null)}
          onOfferSuccess={refreshAfterChange} onPlayerUpdated={refreshAfterChange}
        />
      )}
      {selectedStaff && (
        <StaffDetailModal staff={selectedStaff} currentClubId={currentClubId} cashBalance={cashBalance}
          initialTab={arriving ? 'offer' : 'skills'} onClose={() => setSelectedStaff(null)}
          onOfferSuccess={refreshAfterChange}
        />
      )}
      {action && (
        <ConfirmModal isOpen title={action.label} confirmText={action.label} variant={action.variant} isLoading={working}
          message={<>{action.message}{actionError && <p className="club-transfer-error" role="alert">{actionError}</p>}</>}
          onConfirm={confirmAction} onClose={() => setAction(null)}
        />
      )}
    </div>
  );
}
