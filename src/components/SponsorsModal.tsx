import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Handshake, Loader2, X } from 'lucide-react';
import { useTranslation } from '../i18n';
import { Sponsorship, SponsorshipSummary, sponsorshipsApi } from '../services/sponsorships.service';
import { SponsorList } from './SponsorList';
import { formatSponsorAmount, localizeSponsorSeason, sponsorshipErrorKey, sponsorshipLocale } from '../utils/sponsorshipLocalization';
import './sponsors.css';

interface Props {
  clubId: string;
  onClose: () => void;
  onSigned: (summary: SponsorshipSummary) => void;
}

export function SponsorsModal({ clubId, onClose, onSigned }: Props) {
  const { t, language } = useTranslation();
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const signingRef = useRef(false);
  const [summary, setSummary] = useState<SponsorshipSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ name: string; amount: number } | null>(null);
  const [retry, setRetry] = useState(0);
  const money = (amount: number) => formatSponsorAmount(amount, language);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog.current?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(null);
    sponsorshipsApi.open(clubId).then(data => { if (active) setSummary(data); })
      .catch(err => { if (active) setError(sponsorshipErrorKey(err, 'sponsors.load_error')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [clubId, retry]);

  const sign = async (offer: Sponsorship) => {
    if (signingRef.current || !summary?.available_slots) return;
    signingRef.current = true;
    setSigningId(offer.id); setError(null); setSuccess(null);
    try {
      const updated = await sponsorshipsApi.sign(clubId, offer.id);
      setSummary(updated);
      setSuccess({ name: offer.name, amount: offer.amount });
      onSigned(updated);
    } catch (err: any) {
      setError(sponsorshipErrorKey(err, 'sponsors.sign_error'));
      // Another tab may have consumed the last slot or signed this offer.
      try { setSummary(await sponsorshipsApi.get(clubId)); } catch { /* Keep current offers for retry. */ }
    } finally { signingRef.current = false; setSigningId(null); }
  };

  return createPortal(<dialog ref={dialog} className="sponsors-dialog" aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); if (!signingRef.current) onClose(); }}
    onClick={event => { if (event.target === event.currentTarget && !signingRef.current) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }}>
    <header className="sponsors-heading"><div><h2 id={titleId}><Handshake size={24} />{t('sponsors.title')}</h2><p className="text-muted">{summary ? localizeSponsorSeason(summary.season_name, language, summary.season_number) : t('sponsors.subtitle')}</p></div><button className="btn btn-outline btn-sm" aria-label={t('sponsors.close')} disabled={!!signingId} onClick={onClose}><X size={20} /></button></header>
    <div className="sponsors-body" aria-busy={loading}>
      <p className="sponsors-help text-muted">{t('sponsors.rules')}</p>
      {loading && <p role="status" className="sponsors-loading"><Loader2 size={20} className="spinner-icon" />{t('sponsors.loading')}</p>}
      {error && <div role="alert" className="alert alert-error"><p>{t(error)}</p>{!summary && <button className="btn btn-outline btn-sm" onClick={() => setRetry(value => value + 1)}>{t('sponsors.retry')}</button>}</div>}
      {success && <p role="status" className="alert alert-success">{t('sponsors.signed', { name: success.name, amount: money(success.amount) })}</p>}
      {!loading && summary && <>
        <div className="sponsors-metrics">
          <div><span>{t('sponsors.reputation')}</span><strong>{summary.reputation.toLocaleString(sponsorshipLocale(language))}</strong></div>
          <div><span>{t('sponsors.level')}</span><strong>{summary.finance_level}/10</strong></div>
          <div><span>{t('sponsors.slots')}</span><strong>{summary.signed_count}/{summary.max_contracts}</strong></div>
          <div><span>{t('sponsors.income')}</span><strong>{money(summary.total_income)}</strong></div>
        </div>
        <p className="sponsors-help text-muted">{t('sponsors.chances')} {t('sponsors.fixed')}</p>
        <h3>{t('sponsors.offers')} · {summary.offers.length}</h3>
        {!summary.available_slots && <p className="alert alert-success">{t('sponsors.limit')}</p>}
        {summary.offers.length ? <SponsorList sponsors={summary.offers} onSign={sign} signingId={signingId} disabled={!summary.available_slots} /> : <p className="sponsors-empty text-muted">{t('sponsors.no_offers')}</p>}
      </>}
    </div>
    <footer className="sponsors-footer"><button className="btn btn-outline" disabled={!!signingId} onClick={onClose}>{t('sponsors.close')}</button></footer>
  </dialog>, document.body);
}
