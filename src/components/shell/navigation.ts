import {
  ArrowLeftRight, BriefcaseBusiness, Building2, ChartNoAxesCombined, ClipboardList,
  House, Sprout, Shirt, ShoppingCart, Swords, Trophy, Weight,
} from 'lucide-react';

export const clubNavigation = [
  { to: '/dashboard', label: 'nav.dock.dashboard', icon: House },
  { to: '/squad', label: 'nav.dock.squad', icon: Shirt },
  { to: '/academy', label: 'academy.nav', icon: Sprout },
  { to: '/staff', label: 'nav.dock.staff', icon: BriefcaseBusiness },
  { to: '/tactics', label: 'nav.dock.tactics', icon: ClipboardList },
  { to: '/training', label: 'nav.dock.training', icon: Weight },
  { to: '/club/transfers', label: 'v2.transfers', icon: ArrowLeftRight },
  { to: '/matches', label: 'nav.dock.matches', icon: Swords },
  { to: '/facilities', label: 'nav.dock.facilities', icon: Building2 },
  { to: '/finances', label: 'nav.dock.finances', icon: ChartNoAxesCombined },
  { to: '/trophies', label: 'v2.trophies', icon: Trophy },
];

export function isFederationPath(pathname: string) {
  return pathname.startsWith('/competitions/') || pathname === '/standings';
}

export const competitionsLink = {
  to: '/competitions/league',
  label: 'v2.competitions',
  icon: Trophy,
};

export const worldNavigation = [
  competitionsLink,
  { to: '/transfers', label: 'v2.transferMarket', icon: ShoppingCart },
];
