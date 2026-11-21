import { useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Dumbbell, Plus, Zap } from 'lucide-react';
import { useTranslation } from '../i18n';
import type { TrainingType } from '../types';
import { trainingAttributeNames, trainingDrillGroup, TrainingDrillGroup } from '../utils/training';

export function TrainingDrillImage({ code, name }: { code?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return <span className="training-drill-image">
    {code && !failed ? <img src={`${import.meta.env.BASE_URL}assets/images/training_types/${encodeURIComponent(code)}.jpg`} alt={name} onError={() => setFailed(true)} />
      : <Dumbbell size={28} aria-hidden="true" />}
  </span>;
}

interface Props {
  types: TrainingType[];
  slots: string[];
  activeSlot: number;
  fitnessCost: number;
  disabled: boolean;
  onChoose: (id: string) => void;
}

export function TrainingDrillLibrary({ types, slots, activeSlot, fitnessCost, disabled, onChoose }: Props) {
  const { t, language } = useTranslation();
  const [group, setGroup] = useState<TrainingDrillGroup>('ATTACK');
  const track = useRef<HTMLDivElement>(null);
  const groups: TrainingDrillGroup[] = ['ATTACK', 'DEFENSE', 'PHYSICAL_MENTAL'];
  const visible = types.filter(type => trainingDrillGroup(type.category) === group);
  const scroll = (direction: number) => track.current?.scrollBy({ left: direction * track.current.clientWidth * 0.8 });

  return <div className="training-library">
    <div className="training-library-toolbar">
      <div className="training-library-tabs">{groups.map(value => <button type="button" key={value} className={`group-${value}`} aria-pressed={group === value} disabled={disabled}
        onClick={() => { setGroup(value); if (track.current) track.current.scrollLeft = 0; }}>{t(`training.library.${value}`)}<span>{types.filter(type => trainingDrillGroup(type.category) === value).length}</span></button>)}</div>
      <div className="training-library-arrows"><button type="button" aria-label={t('training.ui.previousDrills')} disabled={disabled} onClick={() => scroll(-1)}><ChevronLeft size={18} /></button>
        <button type="button" aria-label={t('training.ui.nextDrills')} disabled={disabled} onClick={() => scroll(1)}><ChevronRight size={18} /></button></div>
    </div>
    <div className="training-library-track" ref={track} tabIndex={0} role="group" aria-label={t(`training.library.${group}`)}>
      {visible.map(drill => {
        const name = t(`training.drill.${drill.code}.name`, drill.name);
        const count = slots.filter(id => id === drill.id).length;
        return <button type="button" key={drill.id} className={`training-library-card group-${group} ${count ? 'is-chosen' : ''}`} disabled={disabled}
          draggable={!disabled} onDragStart={event => { event.dataTransfer.setData('application/x-football-training-type', drill.id); event.dataTransfer.setData('text/plain', drill.id); event.dataTransfer.effectAllowed = 'copy'; }}
          onClick={() => onChoose(drill.id)} aria-label={t('training.ui.addToSlot', { name, number: activeSlot + 1 })}>
          <span className="training-library-picture"><TrainingDrillImage key={drill.code} code={drill.code} name={name} />
            {count > 0 && <span className="training-library-count"><Check size={12} />×{count}</span>}</span>
          <span className="training-library-card-body"><span className="training-library-category">{t(`training.group.${drill.category}`, drill.category)}</span>
            <strong>{name}</strong><span className="training-library-description">{t(`training.drill.${drill.code}.description`, drill.description || '')}</span>
            <span className="training-attributes">{drill.attributes.map(key => <span key={key}>{trainingAttributeNames[key]?.[language === 'vi' ? 0 : 1] || key.toUpperCase()}</span>)}</span>
          </span>
          <span className="training-library-card-footer"><span><Zap size={12} />−{fitnessCost}%</span><Plus size={16} /></span>
        </button>;
      })}
      {!visible.length && <p>{t('training.ui.noDrills')}</p>}
    </div>
  </div>;
}
