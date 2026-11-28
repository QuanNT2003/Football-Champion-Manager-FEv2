import { MatchResultHeader } from './MatchResultHeader';
export { MatchResultHeader } from './MatchResultHeader';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Play } from 'lucide-react';
import { useTranslation } from '../i18n';
import { isMatchFinished } from '../utils/matchPresentation';
import { matchesApi } from '../services/matches.service';
import { Match } from '../types';
import { MatchReportPanel, MatchReportTab, MATCH_REPORT_TABS } from './MatchReportPanel';
import './match-report.css';

export function MatchDetailView({ onMatchSimulated }: { onMatchSimulated?: () => void | Promise<void> }) {
  const { id } = useParams<{ id: string }>();
  const [search, setSearch] = useSearchParams();
  const { t } = useTranslation();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const selected = search.get('tab');
  const tab: MatchReportTab = MATCH_REPORT_TABS.includes(selected as MatchReportTab) ? selected as MatchReportTab : 'statistics';

  useEffect(() => {
    let active = true;
    setLoading(true); setMatch(null); setError(null);
    if (!id) { setLoading(false); setError(t('match_detail.load_error')); return; }
    matchesApi.getMatchById(id).then(data => { if (active) setMatch(data); })
      .catch(() => { if (active) setError(t('match_detail.load_error')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, retry, t]);

  const simulate = async () => {
    if (!id || simulating) return;
    setSimulating(true); setError(null);
    try {
      await matchesApi.simulateMatch(id);
      setMatch(await matchesApi.getMatchById(id));
      await onMatchSimulated?.();
    } catch (err: any) { setError(err.response?.data?.message || t('matches.sim_error')); }
    finally { setSimulating(false); }
  };
  return <section className="match-detail-page" aria-label={t('matches.match_details')}>
    <div className="match-page-heading">
      <Link to="/matches" className="match-back-link"><ArrowLeft size={17} />{t('match_detail.back')}</Link>
      <h1>{t('matches.match_details')}</h1>
      {match && !isMatchFinished(match.status) && <button className="btn btn-primary" disabled={simulating} onClick={simulate}>
        {simulating ? <Loader2 size={16} className="spinner-icon" /> : <Play size={16} />}
        {t(simulating ? 'matches.simulating' : 'matches.simulate_btn')}
      </button>}
    </div>
    {error && <div className="match-page-error" role="alert"><p>{error}</p>{!match && <button className="btn btn-secondary" onClick={() => setRetry(n => n + 1)}>{t('common.refresh')}</button>}</div>}
    {loading ? <div className="match-page-loading" role="status"><Loader2 className="spinner-icon" />{t('match_detail.loading')}</div>
      : match && <><MatchResultHeader match={match} /><MatchReportPanel match={match} tab={tab} onTabChange={next => setSearch(previous => { const updated = new URLSearchParams(previous); updated.set('tab', next); return updated; }, { replace: true })} /></>}
  </section>;
}
