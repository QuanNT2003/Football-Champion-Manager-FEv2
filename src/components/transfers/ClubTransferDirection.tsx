import { ReactNode } from 'react';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Building2, History, Inbox, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { LicenseBadge } from '../common/LicenseBadge';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { PositionBadge } from '../common/PositionBadge';
import { RoleBadge } from '../common/RoleBadge';
import { StaffAvatar } from '../common/StaffAvatar';

export interface TransferPerson {
  id: string;
  kind: 'players' | 'staff';
  name: string;
  photo?: string | null;
  position?: string;
  role?: string;
  license?: string;
  age?: number;
  rating?: number;
}

export interface TransferOfferAction {
  label: string;
  message: string;
  variant: 'success' | 'danger';
  run: () => Promise<unknown>;
}

export interface TransferCard {
  person: TransferPerson;
  openProfile?: () => void;
  offers: Array<{
    id: string;
    club: string;
    season?: number | null;
    day?: number | null;
    terms: Array<{ label: string; value: ReactNode }>;
    actions: TransferOfferAction[];
  }>;
}

export interface TransferHistoryRow {
  id: string;
  person: TransferPerson;
  club?: string;
  season?: number | null;
  day?: number | null;
  type: string;
  amount: string;
}

function TransferGameTime({ season, day }: { season?: number | null; day?: number | null }) {
  const { t } = useTranslation();
  if (season == null) return <span className="club-transfer-time club-transfer-time-unknown" title={t('club_transfers.game_time_unknown')}>—</span>;
  return (
    <span className="club-transfer-time">
      {day == null ? t('club_transfers.game_season', { season }) : t('club_transfers.game_day', { season, day })}
    </span>
  );
}

function PersonSummary({ person, onOpen }: { person: TransferPerson; onOpen?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="club-transfer-person">
      {person.kind === 'staff'
        ? <StaffAvatar name={person.name} role={person.role} photoUrl={person.photo ?? undefined} size={40} />
        : <PlayerAvatar name={person.name} position={person.position} photoUrl={person.photo ?? undefined} />}
      <div>
        {onOpen ? <button className="club-transfer-profile" type="button" onClick={onOpen}>{person.name}</button> : <strong>{person.name}</strong>}
        <div className="club-transfer-meta">
          {person.position && <PositionBadge position={person.position} />}
          {person.role && <RoleBadge role={person.role} size="sm" />}
          {person.license && <LicenseBadge license={person.license} size="sm" />}
          {person.age != null && <span>{t('club_transfers.age', { age: person.age })}</span>}
          {person.rating != null && <span>OVR {person.rating}</span>}
        </div>
      </div>
    </div>
  );
}

export function ClubTransferDirection({ direction, kind, cards, history, loading, onAction }: {
  direction: 'arrivals' | 'departures';
  kind: TransferPerson['kind'];
  cards: TransferCard[] | null;
  history: TransferHistoryRow[] | null;
  loading: boolean;
  onAction: (action: TransferOfferAction) => void;
}) {
  const { t } = useTranslation();
  const arriving = direction === 'arrivals';
  const DirectionIcon = arriving ? ArrowDownLeft : ArrowUpRight;
  const clubLabel = t(arriving ? 'club_detail.from_club' : 'club_detail.to_club');
  const seasonLabel = t('club_transfers.season_column');
  const typeLabel = t('club_detail.contract_type');
  const amountLabel = t(kind === 'staff' ? 'club_transfers.weekly_wage' : 'club_detail.transfer_fee');

  return (
    <>
      <section className="club-transfer-section" aria-labelledby="club-transfer-open">
        <header>
          <span className="club-transfer-section-icon"><DirectionIcon size={18} aria-hidden="true" /></span>
          <h2 id="club-transfer-open">{t('club_transfers.active')}</h2>
          {cards && cards.length > 0 && <span className="club-transfer-count">{cards.length}</span>}
        </header>
        {loading && <p className="club-transfer-empty" role="status"><Loader2 className="animate-spin" size={16} />{t('common.loading')}</p>}
        {cards && (cards.length ? (
          <ul className="club-transfer-cards">
            {cards.map(({ person, openProfile, offers }) => (
              <li key={person.id} className="club-transfer-card">
                <div className="club-transfer-card-heading">
                  <PersonSummary person={person} onOpen={openProfile} />
                  <span>{t(arriving ? 'club_transfers.our_offers' : 'club_transfers.received_offers', { count: offers.length })}</span>
                </div>
                <ul className="club-transfer-offers">
                  {offers.map(offer => (
                    <li key={offer.id} className="club-transfer-offer">
                      <div className="club-transfer-offer-club">
                        <Building2 size={17} aria-hidden="true" />
                        <div>
                          <strong>{offer.club}</strong>
                          {offer.season != null && <TransferGameTime season={offer.season} day={offer.day} />}
                        </div>
                      </div>
                      <dl>
                        {offer.terms.map(term => (
                          <div key={term.label}><dt>{term.label}</dt><dd>{term.value}</dd></div>
                        ))}
                      </dl>
                      {offer.actions.length > 0 && (
                        <div className="club-transfer-actions">
                          {offer.actions.map(action => (
                            <button type="button" key={action.label} className={`btn btn-xs btn-${action.variant}`} onClick={() => onAction(action)}>
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <div className="club-transfer-empty club-transfer-empty-active">
            <span className="club-transfer-empty-icon"><Inbox size={24} aria-hidden="true" /></span>
            <div>
              <p>{t(arriving ? 'club_transfers.empty_sent' : 'club_transfers.empty_received')}</p>
              {arriving && (
                <Link to={kind === 'staff' ? '/transfers?tab=staff' : '/transfers'}>
                  {t('v2.transferMarket')}<ArrowRight size={15} aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </section>
      <section className="club-transfer-section" aria-labelledby="club-transfer-history">
        <header>
          <span className="club-transfer-section-icon"><History size={18} aria-hidden="true" /></span>
          <h2 id="club-transfer-history">{t(arriving ? 'club_transfers.arrival_history' : 'club_transfers.departure_history')}</h2>
        </header>
        {history && (history.length ? (
          <div className="club-transfer-table">
            <table className="table-hud" role="table">
              <thead>
                <tr>
                  <th scope="col">{t(kind === 'staff' ? 'club_transfers.staff' : 'club_transfers.players')}</th>
                  {kind === 'players' && <th scope="col">{clubLabel}</th>}
                  <th scope="col">{seasonLabel}</th>
                  <th scope="col">{typeLabel}</th>
                  <th scope="col">{amountLabel}</th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {history.map(row => (
                  <tr key={row.id} role="row">
                    <td role="cell"><PersonSummary person={row.person} /></td>
                    {kind === 'players' && <td role="cell" data-label={clubLabel}>{row.club}</td>}
                    <td role="cell" data-label={seasonLabel}><TransferGameTime season={row.season} day={row.day} /></td>
                    <td role="cell" data-label={typeLabel}>{row.type}</td>
                    <td role="cell" className="club-transfer-amount" data-label={amountLabel}>{row.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="club-transfer-empty">{t('club_detail.no_transfers')}</p>)}
      </section>
    </>
  );
}
