import { Clock3 } from 'lucide-react';
import { useEffect, useState } from 'react';

const clockFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Ho_Chi_Minh',
});

export function GameClock({ title }: { title: string }) {
  const [time, setTime] = useState(() => clockFormat.format(new Date()));

  useEffect(() => {
    const interval = window.setInterval(() => setTime(clockFormat.format(new Date())), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return <span className="game-clock" title={title}><Clock3 size={14} /> {time}</span>;
}
