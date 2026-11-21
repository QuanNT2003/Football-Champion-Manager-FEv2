import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, X } from 'lucide-react';
import { useTranslation } from '../i18n';
import type { TrainingSession } from '../types';
import { summarizeTrainingGains, trainingAttributeNames } from '../utils/training';
import './TrainingResultModal.css';

interface Props {
  session: TrainingSession;
  onClose: () => void;
}

export function TrainingResultModal({ session, onClose }: Props) {
  const { language } = useTranslation();
  const vi = language === 'vi';
  const text = (vn: string, en: string) => vi ? vn : en;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const players = (session.results?.players || []).map(player => ({
    ...player, gains: summarizeTrainingGains(player.drills),
  }));
  const total = players.reduce((sum, player) => sum + player.gains.reduce((n, gain) => n + gain.amount, 0), 0);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return createPortal(<dialog
    ref={dialogRef}
    className="training-result-dialog"
    aria-labelledby={titleId}
    aria-describedby={descriptionId}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}
  >
    <header className="training-result-header">
      <div><span className="training-result-eyebrow"><CheckCircle2 size={15} />{text('BUỔI TẬP HOÀN THÀNH', 'TRAINING COMPLETE')}</span>
        <h2 id={titleId}>{text('Kết quả tập luyện', 'Training results')}</h2>
        <p id={descriptionId}>{session.plan?.squadType && <>{text(session.plan.squadType === 'FIRST_TEAM' ? 'Đội một' : 'Đội trẻ', session.plan.squadType === 'FIRST_TEAM' ? 'First team' : 'Youth team')} · </>}
          {players.length} {text('cầu thủ', 'players')} · <strong>+{total}</strong> {text('điểm chỉ số trong buổi tập này', 'attribute points this session')}</p>
      </div>
      <button type="button" className="training-result-close" onClick={onClose} aria-label={text('Đóng kết quả tập luyện', 'Close training results')}><X size={20} /></button>
    </header>
    <div className="training-result-body">
      <table className="training-result-table">
        <thead><tr><th scope="col">{text('Cầu thủ', 'Player')}</th><th scope="col">{text('Chỉ số tăng', 'Attribute gains')}</th></tr></thead>
        <tbody>{players.map(player => <tr key={player.id}>
          <th scope="row"><strong>{player.name}</strong><small>{text('Thể lực', 'Fitness')}: {player.fitnessBefore}% → {player.fitnessAfter}%</small></th>
          <td>{player.gains.length ? <div className="training-result-gains">{player.gains.map(gain => <span key={gain.attribute}>
            <b>+{gain.amount}</b> {trainingAttributeNames[gain.attribute]?.[vi ? 0 : 1] || gain.attribute.toUpperCase()}
          </span>)}</div> : <span className="training-result-no-gains">{text('Chưa tăng chỉ số', 'No attribute gains')}</span>}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <footer className="training-result-footer">
      <p>{text('Các chỉ số trùng nhau trong 6 bài đã được cộng gộp.', 'Gains from repeated attributes across the six drills are combined.')}</p>
      <button type="button" onClick={onClose}>{text('Hoàn tất', 'Done')}</button>
    </footer>
  </dialog>, document.body);
}
