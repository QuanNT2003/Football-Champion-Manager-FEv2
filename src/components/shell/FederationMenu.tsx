import { Globe2, Trophy, Swords, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { CompetitionsMenuResponse } from '../../services/competitions.service';
import { useTournamentLocale } from '../../utils/tournamentLocalization';

export function FederationMenu({ menu, onSelect }: {
  menu: CompetitionsMenuResponse | null;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const { comp } = useTournamentLocale();
  const location = useLocation();
  const domestic = menu?.domestic;
  const groups = [
    {
      label: t('v2.domestic'),
      Icon: Trophy,
      links: [
        { to: '/competitions/league', name: domestic?.league.name || t('dashboard.comp.nat_league') },
        ...(domestic?.nationalCup ? [{ to: `/competitions/cup?id=${domestic.nationalCup.id}`, name: domestic.nationalCup.name }] : []),
        ...(domestic?.superCup ? [{ to: `/competitions/cup?id=${domestic.superCup.id}`, name: domestic.superCup.name }] : []),
        ...(domestic?.youthCup ? [{ to: `/competitions/youth?id=${domestic.youthCup.id}`, name: domestic.youthCup.name }] : []),
      ],
    },
    {
      label: t('v2.continental'),
      Icon: Swords,
      links: (menu?.continental ?? []).map(item => ({ to: `/competitions/continental?id=${item.id}`, name: item.name })),
    },
    {
      label: t('v2.international'),
      Icon: Globe2,
      links: (menu?.international ?? []).map(item => ({ to: `/competitions/international?id=${item.id}`, name: item.name })),
    },
  ];

  return (
    <div className="game-federation-grid" id="federation-menu">
      {groups.filter(group => group.links.length).map(({ label, Icon, links }) => (
        <div key={label}>
          <h2><Icon size={16} /> {label}</h2>
          {links.map(({ to, name }) => {
            const active = to === location.pathname + location.search
              || (to === '/competitions/league' && ['/standings', to].includes(location.pathname));
            return (
              <Link key={to} to={to} onClick={onSelect} className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined}>
                {comp(name)} <ChevronRight size={14} />
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

