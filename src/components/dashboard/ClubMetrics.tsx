import { Activity, Gauge, HeartPulse, Shirt } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { DashboardData } from '../../types';

export function ClubMetrics({ data, squadCount }: { data: DashboardData | null; squadCount: number }) {
  const { t, language } = useTranslation();
  const number = new Intl.NumberFormat(language, { maximumFractionDigits: 1 });
  const items = [
    { label: 'dashboard.comp.players_count', value: data?.metrics?.players_count ?? squadCount, Icon: Shirt, link: '/squad' },
    { label: 'dashboard.comp.avg_ovr', value: data?.metrics?.avg_ovr, Icon: Gauge },
    { label: 'dashboard.hero.morale', value: data?.club?.team_morale, Icon: HeartPulse, percent: true },
    { label: 'dashboard.hero.popularity', value: data?.club?.popularity, Icon: Activity, percent: true },
  ];

  return (
    <div className="game-metrics">
      {items.map(({ label, value, Icon, link, percent }) => {
        const content = <>
          <Icon size={19} />
          <div><span>{t(label)}</span><strong>{value == null ? '—' : `${number.format(value)}${percent ? '%' : ''}`}</strong></div>
          {percent && value != null && <meter aria-label={t(label)} value={value} min={0} max={100} />}
        </>;
        return link ? <Link key={label} className="game-metric" to={link}>{content}</Link> : <div key={label} className="game-metric">{content}</div>;
      })}
    </div>
  );
}
