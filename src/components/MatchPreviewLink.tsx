import { useCallback, useState } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { Match } from '../types';
import { MatchPreviewModal } from './MatchPreviewModal';

type Props = Omit<LinkProps, 'to'> & {
  matchId?: string;
  initialMatch?: Match;
  onSimulateMatch?: (id: string) => Promise<unknown>;
  onMatchSimulated?: () => void | Promise<void>;
};

/** A normal click previews the fixture; modified clicks retain standard link behavior. */
export function MatchPreviewLink({ matchId, initialMatch, onSimulateMatch, onMatchSimulated, onClick, children, ...props }: Props) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return <>
    <Link {...props} to={matchId ? `/matches/${matchId}` : '/matches'} aria-haspopup={matchId ? 'dialog' : undefined} onClick={event => {
      onClick?.(event);
      if (!matchId || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || props.target === '_blank') return;
      event.preventDefault(); setOpen(true);
    }}>{children}</Link>
    {open && matchId && <MatchPreviewModal matchId={matchId} initialMatch={initialMatch} onClose={close} onSimulateMatch={onSimulateMatch} onMatchSimulated={onMatchSimulated} />}
  </>;
}
