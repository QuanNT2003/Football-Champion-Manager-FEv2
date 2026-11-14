import { LucideIcon } from 'lucide-react';
import { ChangeEventHandler } from 'react';

interface AuthFieldProps {
  label: string;
  name: string;
  icon: LucideIcon;
  type?: 'text' | 'email' | 'password';
  autoComplete: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
}

export function AuthField({ label, name, icon: Icon, type = 'text', autoComplete, value, onChange }: AuthFieldProps) {
  return (
    <label className="game-auth-field">
      <span>{label}</span>
      <span>
        <Icon size={17} />
        <input name={name} type={type} autoComplete={autoComplete} value={value} onChange={onChange} required />
      </span>
    </label>
  );
}
