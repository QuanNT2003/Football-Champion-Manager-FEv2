import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowUpRight, CheckCircle2, Loader2, LockKeyhole, Sprout, Users, X } from 'lucide-react';
import { useTranslation } from '../i18n';
import { academyApi, AcademyCandidate, AcademyOverview } from '../services/academy.service';
import { Player } from '../types';
import { getFacepackUrl } from '../utils/image';
import { formatCurrency } from '../utils/formatters';
import './AcademyView.css';

interface Props {
  clubId: string;
  seasonId?: string;
  onSelectPlayer: (player: Player) => void;
  onSquadChanged: () => Promise<void> | void;
}

function Portrait({ path, name }: { path?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const src = getFacepackUrl(path);
  return <span className="academy-portrait" aria-hidden="true">
    {src && !failed ? <img src={src} alt="" onError={() => setFailed(true)} /> : <span>{name.charAt(0)}</span>}
  </span>;
}

export function AcademyView({ clubId, seasonId, onSelectPlayer, onSquadChanged }: Props) {
  const { t } = useTranslation();
  const [data, setData] = useState<AcademyOverview | null>(null);
  const [candidates, setCandidates] = useState<AcademyCandidate[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [signing, setSigning] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const activeClub = useRef(clubId);
  activeClub.current = clubId;
  const mounted = useRef(true);
  const busy = useRef(false);
  const revision = useRef(0);
  const latestOverview = useRef<AcademyOverview | null>(null);
  const panelHeading = useRef<HTMLHeadingElement>(null);

  const errorMessage = (err: unknown) => {
    const message = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
    return Array.isArray(message) ? message.join(', ') : message || t('academy.loadError');
  };

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    let refreshing = false;
    setData(null);
    latestOverview.current = null;
    setCandidates(null);
    setError('');
    setNotice('');
    setLoading(true);
    const refresh = async () => {
      if (refreshing || busy.current || controller.signal.aborted) return;
      refreshing = true;
      const requestRevision = revision.current;
      try {
        const overview = await academyApi.overview(clubId, controller.signal);
        if (controller.signal.aborted || requestRevision !== revision.current) return;
        if (latestOverview.current && latestOverview.current.season.id !== overview.season.id) setCandidates(null);
        latestOverview.current = overview;
        setData(overview);
        if (!overview.transferOpen) setCandidates(null);
        setError('');
      } catch (err) {
        if (!controller.signal.aborted && requestRevision === revision.current) setError(errorMessage(err));
      } finally {
        refreshing = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void refresh();
    const foregroundRefresh = () => { if (!document.hidden) void refresh(); };
    const timer = window.setInterval(foregroundRefresh, 60000);
    window.addEventListener('focus', foregroundRefresh);
    document.addEventListener('visibilitychange', foregroundRefresh);
    return () => {
      mounted.current = false;
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener('focus', foregroundRefresh);
      document.removeEventListener('visibilitychange', foregroundRefresh);
    };
  // Translations do not affect data fetching or reset the recruitment panel.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, seasonId]);

  useEffect(() => { if (candidates !== null) panelHeading.current?.focus(); }, [candidates]);

  const refreshOverview = async () => {
    const overview = await academyApi.overview(clubId);
    if (mounted.current && activeClub.current === clubId) {
      setData(overview);
      if (!overview.transferOpen || overview.season.id !== latestOverview.current?.season.id) setCandidates(null);
      latestOverview.current = overview;
    }
    return overview;
  };

  const openRecruitment = async () => {
    if (busy.current || !data?.canRecruit) return;
    busy.current = true;
    revision.current++;
    setOpening(true);
    setError('');
    setNotice('');
    try {
      const result = await academyApi.recruitment(clubId);
      const overview = await refreshOverview();
      if (mounted.current && activeClub.current === clubId && overview.transferOpen && overview.season.id === result.seasonId) {
        setCandidates(result.candidates);
      }
    } catch (err) {
      if (mounted.current && activeClub.current === clubId) {
        setError(errorMessage(err));
        await refreshOverview().catch(() => undefined);
      }
    } finally {
      busy.current = false;
      if (mounted.current && activeClub.current === clubId) setOpening(false);
    }
  };

  const sign = async (candidate: AcademyCandidate) => {
    if (busy.current || !data?.transferOpen) return;
    busy.current = true;
    revision.current++;
    setSigning(candidate.id);
    setError('');
    setNotice('');
    try {
      const result = await academyApi.sign(clubId, candidate.id);
      if (!mounted.current || activeClub.current !== clubId) return;
      setCandidates(current => current?.filter(item => item.id !== candidate.id) ?? null);
      setData(current => current ? { ...current, remainingCandidates: result.remainingCandidates, canRecruit: result.remainingCandidates > 0 && current.transferOpen } : null);
      setNotice(t('academy.signed', { name: `${candidate.first_name} ${candidate.last_name}` }));
      // Signing has succeeded even if refreshing the roster fails; never invite a second signing.
      await Promise.allSettled([refreshOverview(), Promise.resolve(onSquadChanged())]);
    } catch (err) {
      if (mounted.current && activeClub.current === clubId) {
        setError(errorMessage(err));
        setCandidates(null);
        await refreshOverview().catch(() => undefined);
      }
    } finally {
      busy.current = false;
      if (mounted.current && activeClub.current === clubId) setSigning(null);
    }
  };

  return <div className="academy-page">
    <header className="academy-header">
      <div><span className="academy-eyebrow"><Sprout size={16} /> {t('academy.eyebrow')}</span>
        <h2>{t('academy.title')}</h2><p>{t('academy.description')}</p></div>
      <button className="academy-button academy-primary" disabled={loading || !data?.canRecruit || opening || !!signing} onClick={openRecruitment}>
        {opening ? <Loader2 size={17} className="academy-spin" /> : <Sprout size={17} />}
        {t('academy.recruit')}
      </button>
    </header>

    {error && <div className="academy-message academy-error" role="alert"><AlertCircle size={18} /><span>{error}</span>
      {!data && <button className="academy-button" onClick={() => { setLoading(true); refreshOverview().then(() => setError('')).catch(err => setError(errorMessage(err))).finally(() => setLoading(false)); }}>{t('academy.retry')}</button>}
    </div>}
    {notice && <div className="academy-message academy-success" role="status"><CheckCircle2 size={18} />{notice}</div>}
    {loading && <div className="academy-empty" role="status"><Loader2 className="academy-spin" />{t('academy.loading')}</div>}

    {data && <>
      <div className="academy-stats">
        <div><span>{t('academy.facilityLevel')}</span><strong>{data.academyLevel}<small> / 10</small></strong></div>
        <div><span>{t('academy.currentYouth')}</span><strong>{data.roster.length}<small> {t('academy.players')}</small></strong></div>
        <div><span>{t('academy.intakeRemaining')}</span><strong>{data.remainingCandidates}<small> / {data.totalCandidates}</small></strong></div>
      </div>
      <div className={`academy-window ${data.transferOpen ? 'is-open' : ''}`}>
        {data.transferOpen ? <CheckCircle2 size={17} /> : <LockKeyhole size={17} />}
        <span>{t(data.transferOpen ? 'academy.windowOpen' : 'academy.windowClosed')}</span>
        <small>{data.season.name}</small>
      </div>
      <p className="academy-season-note">{t('academy.fixedPool', { level: data.intakeLevel ?? '—' })}
        {data.intakeLevel !== null && data.intakeLevel !== data.academyLevel && ` ${t('academy.upgradeNextSeason')}`}
        {data.rules && ` ${t('academy.ovrRange', { min: data.rules.minOvr, max: data.rules.maxOvr + 4 })}`}
      </p>

      {candidates !== null && <section className="academy-recruitment" aria-labelledby="academy-candidates-title">
        <div className="academy-section-heading"><div><h3 id="academy-candidates-title" ref={panelHeading} tabIndex={-1}>{t('academy.candidates')}</h3><p>{t('academy.candidateNote')}</p></div>
          <button className="academy-button" onClick={() => setCandidates(null)} aria-label={t('academy.close')}><X size={18} /></button></div>
        {candidates.length === 0 ? <div className="academy-empty"><CheckCircle2 />{t('academy.poolEmpty')}</div> : <div className="academy-candidate-grid">
          {candidates.map(candidate => {
            const name = `${candidate.first_name} ${candidate.last_name}`;
            return <article className={`academy-candidate ${candidate.potential >= 80 ? 'is-elite' : ''}`} key={candidate.id}>
              <div className="academy-candidate-person"><Portrait path={candidate.photo_url} name={name} /><div><h4>{name}</h4><p>{candidate.position.code} · {candidate.age} {t('academy.yearsOld')} · {candidate.nationality.name}</p></div></div>
              <div className="academy-ratings"><div><span>{t('academy.ovr')}</span><strong>{candidate.ovr}</strong></div><div><span>{t('academy.potential')}</span><strong>{candidate.potential}</strong></div>
                {candidate.potential >= 80 && <span className="academy-talent">{t('academy.elite')}</span>}</div>
              <p className="academy-terms">{t('academy.terms', { seasons: candidate.contractSeasons, wage: formatCurrency(candidate.weeklyWage) })}</p>
              <button className="academy-button academy-primary" disabled={!!signing || !data.transferOpen} onClick={() => sign(candidate)} aria-label={t('academy.signName', { name })}>
                {signing === candidate.id ? <Loader2 size={16} className="academy-spin" /> : <ArrowUpRight size={16} />}{t('academy.sign')}
              </button>
            </article>;
          })}
        </div>}
      </section>}

      <section className="academy-roster" aria-labelledby="academy-roster-title">
        <div className="academy-section-heading"><h3 id="academy-roster-title"><Users size={19} />{t('academy.currentYouth')}</h3><span>{data.roster.length} {t('academy.players')}</span></div>
        {!data.roster.length ? <div className="academy-empty"><Sprout />{t('academy.rosterEmpty')}</div> : <div className="academy-table-wrap"><table>
          <thead><tr><th>{t('academy.player')}</th><th>{t('academy.position')}</th><th>{t('academy.age')}</th><th>{t('academy.ovr')}</th><th>{t('academy.potential')}</th></tr></thead>
          <tbody>{data.roster.map(player => {
            const name = `${player.first_name} ${player.last_name}`;
            return <tr key={player.id}><td><button className="academy-player-link" onClick={() => onSelectPlayer(player)}><Portrait path={player.photo_url} name={name} /><span>{name}<small>{typeof player.nationality === 'object' ? player.nationality?.name : player.nationality}</small></span></button></td>
              <td><span className="academy-position">{player.position?.code || '—'}</span></td><td>{player.age}</td><td><strong>{player.ovr}</strong></td><td><strong className={(player.potential ?? 0) >= 80 ? 'academy-elite-value' : ''}>{player.potential}</strong></td></tr>;
          })}</tbody>
        </table></div>}
      </section>
    </>}
  </div>;
}
