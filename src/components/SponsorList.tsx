import { BadgeCheck, Handshake, Loader2 } from 'lucide-react';
import { useTranslation } from '../i18n';
import { Sponsorship } from '../services/sponsorships.service';
import { formatSponsorAmount, localizeSponsorIndustry } from '../utils/sponsorshipLocalization';
import './sponsors.css';

interface Props {
  sponsors: Sponsorship[];
  onSign?: (sponsor: Sponsorship) => void;
  signingId?: string | null;
  disabled?: boolean;
}

export function SponsorList({ sponsors, onSign, signingId, disabled = false }: Props) {
  const { t, language } = useTranslation();
  return <div className="sponsors-list-scroll">
    <table className="sponsors-list">
      <thead><tr>
        <th scope="col">{t('sponsors.name')}</th>
        <th scope="col" className="sponsor-amount-column">{t('sponsors.amount')}</th>
        <th scope="col" className="sponsor-term-column">{t('sponsors.term')}</th>
        <th scope="col" className="sponsor-action-column">{t(onSign ? 'sponsors.action' : 'sponsors.status')}</th>
      </tr></thead>
      <tbody>{sponsors.map(sponsor => <tr key={sponsor.id}>
        <td><strong className="sponsor-name">{sponsor.name}</strong><span className="sponsor-industry text-muted">{localizeSponsorIndustry(sponsor.industry, language)}</span></td>
        <td className="sponsor-amount-column"><strong className="sponsor-list-value">{formatSponsorAmount(sponsor.amount, language)}</strong></td>
        <td className="sponsor-term-column text-muted">{t('sponsors.end_of_season')}</td>
        <td className="sponsor-action-column">{onSign ? <button className="btn btn-primary btn-sm sponsor-sign-button" disabled={disabled || !!signingId} onClick={() => onSign(sponsor)}>
          {signingId === sponsor.id ? <Loader2 size={15} className="spinner-icon" /> : <Handshake size={15} />}
          {t(signingId === sponsor.id ? 'sponsors.signing' : 'sponsors.sign')}
        </button> : <span className="sponsor-active-label"><BadgeCheck size={15} />{t('sponsors.active_status')}</span>}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}
