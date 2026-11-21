import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Users, X } from 'lucide-react';
import { useTranslation } from '../i18n';
import type { TrainingPlayer, TrainingSquad } from '../types';
import { trainingSquad } from '../utils/training';
import './TrainingPlayersModal.css';

interface Props {
  squadType: TrainingSquad;
  players: TrainingPlayer[];
  selected: string[];
  fitnessCost: number;
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
}

export function TrainingPlayersModal({ squadType, players, selected, fitnessCost, onClose, onConfirm }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState(() => selected.filter(id => players.some(p => p.id === id && p.eligible && trainingSquad(p.squadType) === squadType)));
  const dialogRef = useRef<HTMLDialogElement>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const visible = players.filter(p => trainingSquad(p.squadType) === squadType && p.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const eligible = visible.filter(p => p.eligible);
  const allChecked = eligible.length > 0 && eligible.every(p => draft.includes(p.id));
  const anyChecked = eligible.some(p => draft.includes(p.id));

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  useEffect(() => { if (selectAllRef.current) selectAllRef.current.indeterminate = anyChecked && !allChecked; }, [anyChecked, allChecked]);

  const status = (player: TrainingPlayer) => t(`training.ui.${player.eligible ? 'ready' : player.isInjured ? 'injured'
    : player.onNationalDuty ? 'nationalDuty' : player.fitness < fitnessCost ? 'lowFitness' : 'missingData'}`);
  const toggleAll = () => setDraft(ids => allChecked ? ids.filter(id => !eligible.some(p => p.id === id))
    : [...new Set([...ids, ...eligible.map(p => p.id)])]);

  return createPortal(<dialog ref={dialogRef} className="training-players-dialog" aria-labelledby={titleId} aria-describedby={descriptionId}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>
    <header className="training-players-header"><div><h2 id={titleId}><Users size={21} />{t('training.ui.playersTitle')} · {t(squadType === 'FIRST_TEAM' ? 'training.ui.firstTeam' : 'training.ui.youth')}</h2>
      <p id={descriptionId}>{t('training.ui.playersDescription', { cost: fitnessCost })}</p></div>
      <button className="training-players-close" onClick={onClose} aria-label={t('training.ui.closePlayers')}><X size={19} /></button></header>
    <div className="training-players-toolbar">
      <span className="training-players-team-count">{t('training.ui.availablePlayers', { count: players.filter(p => trainingSquad(p.squadType) === squadType).length })}</span>
      <label className="training-players-search"><Search size={15} /><input value={search} onChange={e => setSearch(e.target.value)}
        placeholder={t('training.ui.search')} aria-label={t('training.ui.search')} /></label>
    </div>
    <div className="training-players-body"><table className="training-players-table"><thead><tr>
      <th><input ref={selectAllRef} type="checkbox" aria-label={t('training.ui.selectAll')} checked={allChecked} disabled={!eligible.length} onChange={toggleAll} /></th>
      <th scope="col">{t('training.ui.player')}</th><th scope="col">{t('training.ui.age')}</th><th scope="col">{t('training.ui.fitnessAfter')}</th><th scope="col">{t('training.ui.status')}</th>
    </tr></thead><tbody>{visible.map(player => <tr key={player.id} className={draft.includes(player.id) ? 'is-selected' : ''}>
      <td><input type="checkbox" aria-label={t('training.ui.selectPlayer', { name: player.name })} checked={draft.includes(player.id)} disabled={!player.eligible}
        onChange={e => setDraft(ids => e.target.checked ? [...new Set([...ids, player.id])] : ids.filter(id => id !== player.id))} /></td>
      <th scope="row">{player.name}</th><td>{player.age}</td>
      <td className={player.fitness < fitnessCost ? 'is-low-fitness' : ''}>{player.fitness}% <span>→</span> {Math.max(0, player.fitness - fitnessCost)}%</td>
      <td><span className={`training-player-status ${player.eligible ? 'is-ready' : ''}`}>{status(player)}</span></td>
    </tr>)}</tbody></table>
      {!visible.length && <p className="training-players-empty">{t('training.ui.noPlayers')}</p>}
    </div>
    <footer className="training-players-footer"><span>{t('training.ui.selected', { count: draft.length })}</span><div>
      <button onClick={onClose}>{t('training.ui.cancel')}</button>
      <button className="is-primary" onClick={() => onConfirm(draft.filter(id => players.some(p => p.id === id && p.eligible && trainingSquad(p.squadType) === squadType)))}>{t('training.ui.confirmPlayers', { count: draft.length })}</button>
    </div></footer>
  </dialog>, document.body);
}
