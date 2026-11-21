import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Dumbbell, Loader2, Plus, RefreshCw, Shield, Sparkles, Users, X, Zap } from 'lucide-react';
import { useTranslation } from '../i18n';
import { trainingApi, TrainingOverview, TrainingSession, TrainingSquad } from '../services/training.service';
import { TrainingResultModal } from './TrainingResultModal';
import { TrainingPlayersModal } from './TrainingPlayersModal';
import { TrainingDrillImage, TrainingDrillLibrary } from './TrainingDrillLibrary';
import { trainingSquad } from '../utils/training';
import './TrainingView.css';

interface TrainingViewProps {
  currentClubId: string;
  onSquadChanged?: () => Promise<void> | void;
}
function errorText(error: unknown, fallback: string) {
  const value = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  return Array.isArray(value) ? value.join(', ') : value || fallback;
}

export function TrainingView(props: TrainingViewProps) {
  return <TrainingWorkspace key={props.currentClubId} {...props} />;
}
function TrainingWorkspace(props: TrainingViewProps) {
  const { t } = useTranslation();
  const [active, setActive] = useState<TrainingSquad>('FIRST_TEAM');
  const [trainingBusy, setTrainingBusy] = useState(false);
  const squads: TrainingSquad[] = ['FIRST_TEAM', 'YOUTH'];
  return <div className="training-workspace">
    <div className="training-team-tabs">{squads.map(squad => <button key={squad} type="button" aria-pressed={active === squad} disabled={trainingBusy} onClick={() => setActive(squad)}>
      {squad === 'FIRST_TEAM' ? <Shield size={16} /> : <Sparkles size={16} />}{t(squad === 'FIRST_TEAM' ? 'training.ui.firstTeam' : 'training.ui.youth')}
    </button>)}</div>
    {squads.map(squad => <div key={squad} className="training-team-panel" hidden={squad !== active}>
      <TrainingPanel {...props} squadType={squad} onBusyChange={setTrainingBusy} />
    </div>)}
  </div>;
}

function TrainingPanel({ currentClubId, onSquadChanged, squadType, onBusyChange }: TrainingViewProps & { squadType: TrainingSquad; onBusyChange: (busy: boolean) => void }) {
  const { t } = useTranslation();
  const [data, setData] = useState<TrainingOverview | null>(null);
  const [slots, setSlots] = useState<string[]>(Array(6).fill(''));
  const [activeSlot, setActiveSlot] = useState(0);
  const [dragTarget, setDragTarget] = useState<number | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ players: number; gains: number; cost: number } | null>(null);
  const [resultSession, setResultSession] = useState<TrainingSession | null>(null);
  const generation = useRef(0);
  const busy = useRef(false);
  const teamLabel = t(squadType === 'FIRST_TEAM' ? 'training.ui.firstTeam' : 'training.ui.youth');

  useEffect(() => {
    const controller = new AbortController();
    const version = ++generation.current;
    trainingApi.overview(currentClubId, squadType, controller.signal)
      .then(overview => {
        if (controller.signal.aborted) return;
        setData(overview);
        setSlots([...overview.recommendation.trainingTypeIds]);
        setSelected(overview.players.filter(p => p.eligible && trainingSquad(p.squadType) === squadType).map(p => p.id));
      })
      .catch(err => { if (!controller.signal.aborted) setError(errorText(err, '__load__')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); generation.current = version + 1; };
  }, [currentClubId, squadType]);

  async function refresh() {
    if (busy.current) return;
    const version = generation.current;
    setLoading(true); setError('');
    try {
      const overview = await trainingApi.overview(currentClubId, squadType);
      if (version !== generation.current) return;
      setData(overview);
      setSelected(ids => ids.filter(id => overview.players.some(p => p.id === id && p.eligible && trainingSquad(p.squadType) === squadType)));
    } catch (err) {
      if (version === generation.current) setError(errorText(err, '__load__'));
    } finally { if (version === generation.current) setLoading(false); }
  }

  async function train() {
    if (busy.current || loading || !data || !ready) return;
    busy.current = true; setSubmitting(true); onBusyChange(true); setError(''); setNotice(null);
    const version = generation.current;
    let completed = false;
    try {
      const result = await trainingApi.scheduleSession(currentClubId, slots, chosen.map(p => p.id), squadType);
      if (version !== generation.current) return;
      completed = true;
      setResultSession(result.session);
      const participants = result.session.results?.players || [];
      const gains = participants.reduce((sum, p) => sum + p.drills.reduce((n, d) => n + d.gains.length, 0), 0);
      setNotice({ players: participants.length, gains, cost: data.fitnessCost });
      const fitness = new Map(participants.map(p => [p.id, p.fitnessAfter]));
      setData(old => old && ({ ...old, players: old.players.map(p => fitness.has(p.id)
        ? { ...p, fitness: fitness.get(p.id)!, eligible: p.eligible && fitness.get(p.id)! >= old.fitnessCost } : p) }));
      setSelected(ids => ids.filter(id => !fitness.has(id) || fitness.get(id)! >= data.fitnessCost));
      const overview = await trainingApi.overview(currentClubId, squadType);
      if (version !== generation.current) return;
      setData(overview);
      setSelected(ids => ids.filter(id => overview.players.some(p => p.id === id && p.eligible && trainingSquad(p.squadType) === squadType)));
      await onSquadChanged?.();
    } catch (err) {
      if (version === generation.current) setError(completed ? '__saved__' : errorText(err, '__train__'));
    } finally {
      if (version === generation.current) { busy.current = false; setSubmitting(false); onBusyChange(false); }
    }
  }

  function assignDrill(index: number, id: string) {
    if (loading || submitting || !data?.types.some(type => type.id === id)) return;
    const next = slots.map((value, i) => i === index ? id : value);
    setSlots(next);
    const empty = next.findIndex(value => !value);
    setActiveSlot(empty >= 0 ? empty : (index + 1) % 6);
    setDragTarget(null);
  }

  const players = data?.players.filter(p => trainingSquad(p.squadType) === squadType) || [];
  const chosen = players.filter(p => selected.includes(p.id));
  const filled = slots.filter(id => data?.types.some(type => type.id === id)).length;
  const ready = !!data && slots.length === 6 && filled === 6 && chosen.length > 0 && chosen.every(p => p.eligible);
  const errorKey = error === '__load__' ? 'loadError' : error === '__saved__' ? 'savedRefreshError' : error === '__train__' ? 'trainError' : '';
  const disabled = loading || submitting;

  return <div className="training-page" aria-busy={disabled}>
    <header className="training-heading"><div><span className="training-eyebrow">{teamLabel} · {t('training.ui.eyebrow')}</span>
      <h1><Dumbbell size={25} />{t('training.ui.title')}</h1><p>{t('training.ui.teamTrainingNote', { team: teamLabel })}</p></div>
      <button className="training-button" onClick={() => void refresh()} disabled={disabled}><RefreshCw size={15} />{t('training.ui.refresh')}</button>
    </header>
    {error && <div role="alert" className="training-message is-error"><AlertCircle size={18} />{errorKey ? t(`training.ui.${errorKey}`) : error}</div>}
    {notice && <div role="status" className="training-message"><CheckCircle2 size={18} />{t('training.ui.completed', notice)}</div>}
    {loading && !data && <p role="status"><Loader2 className="training-spin" size={18} /> {t('training.ui.loading')}</p>}
    {data && <>
      <div className="training-facts"><span><Dumbbell size={14} />{t('training.ui.level', { level: data.level })}</span><span>{t('training.ui.sixDrills')}</span>
        <span><Zap size={13} />{t('training.ui.fitnessCost', { cost: data.fitnessCost })}</span><span>{t('training.ui.unlimited')}</span></div>
      <section className="training-panel">
        <div className="training-section-heading"><div><h2>{t('training.ui.drillLibrary')}</h2><p>{t('training.ui.libraryHint')}</p></div>
          <button className="training-button" disabled={disabled} onClick={() => { setSlots([...data.recommendation.trainingTypeIds]); setActiveSlot(0); }}><Sparkles size={15} />{t('training.ui.recommend')}</button></div>
        <p className="training-coach-note">{data.recommendation.headCoach ? t('training.ui.headCoach', { name: data.recommendation.headCoach.name }) : t('training.ui.noHeadCoach')} · {t(`training.style.${data.recommendation.style}`, data.recommendation.style)}</p>
        <TrainingDrillLibrary types={data.types} slots={slots} activeSlot={activeSlot} fitnessCost={data.fitnessPerDrill} disabled={disabled} onChoose={id => assignDrill(activeSlot, id)} />
        <div className="training-programme-heading"><div><h2>{t('training.ui.selectedProgramme')} <span>{filled}/6</span></h2><p>{t('training.ui.activeSlot', { number: activeSlot + 1 })}</p></div>
          <button type="button" className="training-clear" disabled={disabled || !filled} onClick={() => { setSlots(Array(6).fill('')); setActiveSlot(0); }}>{t('training.ui.clearProgramme')}</button></div>
        <div className="training-programme-slots" role="group" aria-label={t('training.ui.programme')}>
          {slots.map((id, index) => {
            const drill = data.types.find(type => type.id === id);
            const name = drill ? t(`training.drill.${drill.code}.name`, drill.name) : t('training.ui.dropDrill');
            return <div key={index} className={`training-programme-slot ${activeSlot === index ? 'is-active' : ''} ${dragTarget === index ? 'is-drag-over' : ''} ${drill ? 'is-filled' : ''}`}
              onDragOver={event => { if (!disabled && event.dataTransfer.types.includes('application/x-football-training-type')) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; setDragTarget(index); } }}
              onDragLeave={event => { if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setDragTarget(null); }}
              onDrop={event => { event.preventDefault(); assignDrill(index, event.dataTransfer.getData('application/x-football-training-type')); setDragTarget(null); }}>
              <button type="button" className="training-programme-select" disabled={disabled} aria-pressed={activeSlot === index} aria-label={t('training.ui.selectSlot', { number: index + 1, name })} onClick={() => setActiveSlot(index)}>
                {drill && <TrainingDrillImage key={drill.code} code={drill.code} name={name} />}
                <span className="training-programme-number">{String(index + 1).padStart(2, '0')}</span>
                {!drill && <Plus size={23} />}<strong>{name}</strong>
              </button>
              {drill && <button type="button" className="training-remove-drill" disabled={disabled} aria-label={t('training.ui.removeDrill', { number: index + 1 })}
                onClick={() => { setSlots(old => old.map((value, i) => i === index ? '' : value)); setActiveSlot(index); }}><X size={13} /></button>}
            </div>;
          })}
        </div>
        <div className="training-session-controls"><div className="training-participants">
          <button className="training-button" disabled={disabled} onClick={() => setSelectionOpen(true)} aria-haspopup="dialog"><Users size={17} />{t('training.ui.choosePlayers')}<b>{chosen.length}</b></button>
          <div><strong>{t('training.ui.selected', { count: chosen.length })}</strong><small>{teamLabel}</small></div>
        </div><button className="training-button is-primary" disabled={!ready || disabled} onClick={() => void train()}>
          {submitting ? <Loader2 className="training-spin" size={17} /> : <Dumbbell size={17} />}{t(submitting ? 'training.ui.training' : 'training.ui.start')}</button></div>
        <p className="training-submit-note">{t('training.ui.instantResults')}</p>
      </section>
      {selectionOpen && <TrainingPlayersModal squadType={squadType} players={players} selected={selected} fitnessCost={data.fitnessCost}
        onClose={() => setSelectionOpen(false)} onConfirm={ids => { setSelected(ids); setSelectionOpen(false); }} />}
    </>}
    {resultSession && <TrainingResultModal key={resultSession.id} session={resultSession} onClose={() => setResultSession(null)} />}
  </div>;
}
