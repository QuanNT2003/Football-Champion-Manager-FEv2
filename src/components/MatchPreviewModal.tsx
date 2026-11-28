import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, Play, X } from 'lucide-react';
import { useTranslation } from '../i18n';
import { Match } from '../types';
import { matchesApi } from '../services/matches.service';
import { isMatchFinished } from '../utils/matchPresentation';
import { MatchResultHeader } from './MatchResultHeader';
import './match-report.css';

interface Props {
  matchId: string;
  initialMatch?: Match;
  onClose: () => void;
  onSimulateMatch?: (id: string) => Promise<unknown>;
  onMatchSimulated?: () => void | Promise<void>;
}

export function MatchPreviewModal({ matchId, initialMatch, onClose, onSimulateMatch, onMatchSimulated }: Props) {
  const { t } = useTranslation();
  const titleId = useId();
  const dialog = useRef<HTMLElement>(null);
  const [match, setMatch] = useState<Match | null>(initialMatch || null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(null);
    matchesApi.getMatchById(matchId).then(data => { if (active) setMatch(data); })
      .catch(() => { if (active) setError(t('match_detail.load_error')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [matchId, retry, t]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  const simulate = async () => {
    if (loading || simulating || !match || isMatchFinished(match.status)) return;
    setSimulating(true); setError(null);
    try {
      await (onSimulateMatch ? onSimulateMatch(matchId) : matchesApi.simulateMatch(matchId));
      setMatch(await matchesApi.getMatchById(matchId));
      await onMatchSimulated?.();
    } catch (err: any) { setError(err.response?.data?.message || t('matches.sim_error')); }
    finally { setSimulating(false); }
  };

  const content = <div className="match-preview-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="match-preview-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialog} tabIndex={-1} onKeyDown={event => {
      if (event.key === 'Escape') { event.stopPropagation(); onClose(); return; }
      if (event.key !== 'Tab') return;
      const targets = [...(dialog.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]') || [])].filter(element => element.getClientRects().length);
      const first = targets[0], last = targets[targets.length - 1];
      if (!first) { event.preventDefault(); dialog.current?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first.focus(); }
    }}>
      <div className="match-preview-heading"><h2 id={titleId}>{t('match_detail.preview_title')}</h2><button type="button" className="match-preview-close" onClick={onClose} aria-label={t('match_detail.close_preview')}><X size={20} /></button></div>
      <div className="match-preview-body" aria-busy={loading}>
        {match && <MatchResultHeader match={match} pending={loading} />}
        {loading && <div className="match-preview-loading" role="status"><Loader2 size={16} className="spinner-icon" />{t('match_detail.loading')}</div>}
        {error && <div className="match-preview-error" role="alert"><p>{error}</p><button type="button" className="btn btn-secondary btn-sm" onClick={() => setRetry(n => n + 1)}>{t('common.refresh')}</button></div>}
        {match && isMatchFinished(match.status) && match.ticketRevenue != null && <div className="match-preview-revenue"><span>{t('matches.ticket_revenue')}</span><strong>€{Number(match.ticketRevenue).toLocaleString()}</strong></div>}
      </div>
      <footer className="match-preview-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>{t('match_detail.close_preview')}</button>
        {match && !isMatchFinished(match.status) && <button type="button" className="btn btn-secondary" disabled={loading || simulating} onClick={simulate}>
          {simulating ? <Loader2 size={15} className="spinner-icon" /> : <Play size={15} />}{t(simulating ? 'matches.simulating' : 'matches.simulate_btn')}
        </button>}
        <Link to={`/matches/${matchId}`} className="btn btn-primary" onClick={onClose}>{t('match_detail.view_details')}<ArrowRight size={16} /></Link>
      </footer>
    </section>
  </div>;
  return typeof document === 'undefined' ? content : createPortal(content, document.body);
}
