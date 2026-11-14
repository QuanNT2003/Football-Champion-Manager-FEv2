import { useTranslation } from '../i18n';
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../services/auth.service';
import { Lock, User, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

import { AuthLayout } from './auth/AuthLayout';
import { AuthField } from './auth/AuthField';

interface Props {
  onAuthSuccess: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthScreen: React.FC<Props> = ({ onAuthSuccess, defaultMode = 'login' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const mode = location.pathname === '/register' ? 'register' : defaultMode;
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchMode = (newMode: 'login' | 'register') => {
    setError(null);
    navigate(newMode === 'login' ? '/login' : '/register');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'login') {
      if (!username.trim() || !password) {
        setError(t('auth.error_required_login', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu'));
        return;
      }
      setLoading(true);
      try {
        await authApi.login(username.trim(), password);
        onAuthSuccess();
      } catch (err: any) {
        setError(err?.response?.data?.message || t('auth.error_invalid_credentials', 'Tài khoản hoặc mật khẩu không chính xác'));
      } finally {
        setLoading(false);
      }
    } else {
      if (!username.trim() || !email.trim() || !password) {
        setError(t('auth.error_required_register', 'Vui lòng điền đầy đủ các thông tin bắt buộc'));
        return;
      }
      if (password !== confirmPassword) {
        setError(t('auth.error_password_mismatch', 'Mật khẩu xác nhận không khớp'));
        return;
      }
      if (password.length < 6) {
        setError(t('auth.error_password_length', 'Mật khẩu phải có ít nhất 6 ký tự'));
        return;
      }
      setLoading(true);
      try {
        await authApi.register(username.trim(), email.trim(), password);
        onAuthSuccess();
      } catch (err: any) {
        setError(err?.response?.data?.message || t('auth.error_register_failed', 'Đăng ký tài khoản thất bại. Tên đăng nhập hoặc email có thể đã tồn tại.'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDemoAccount = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    switchMode('register');
    setUsername(`coach_${randomSuffix}`);
    setEmail(`coach_${randomSuffix}@football.com`);
    setPassword('Pass1234!');
    setConfirmPassword('Pass1234!');
    setError(null);
  };


  const isLogin = mode === 'login';

  return (
    <AuthLayout>
      <section className="game-auth-form" aria-labelledby="auth-title">
        <h2 id="auth-title">{t(isLogin ? 'v2.signIn' : 'v2.signUp')}</h2>
        <div className="game-auth-tabs">
          <button type="button" aria-pressed={isLogin} onClick={() => switchMode('login')}>{t('v2.signIn')}</button>
          <button type="button" aria-pressed={!isLogin} onClick={() => switchMode('register')}>{t('v2.signUp')}</button>
        </div>
        {error && <p className="game-auth-error" role="alert"><AlertCircle size={17} /> {error}</p>}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <AuthField
            name="username" icon={User} autoComplete="username"
            label={t(isLogin ? 'auth.username_or_email_label' : 'auth.username_label')}
            value={username} onChange={event => setUsername(event.target.value)}
          />
          {!isLogin && (
            <AuthField name="email" type="email" icon={Mail} autoComplete="email"
              label={t('auth.email_label')} value={email} onChange={event => setEmail(event.target.value)}
            />
          )}
          <AuthField name="password" type="password" icon={Lock} autoComplete={isLogin ? 'current-password' : 'new-password'}
            label={t('auth.password_label')} value={password} onChange={event => setPassword(event.target.value)}
          />
          {!isLogin && (
            <AuthField name="confirmPassword" type="password" icon={Lock} autoComplete="new-password"
              label={t('auth.confirm_password_label')} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)}
            />
          )}
          <button type="submit" className="game-action game-action-primary game-auth-submit" disabled={loading}>
            {t(loading ? 'auth.verifying' : isLogin ? 'v2.enterGame' : 'v2.createAccount')} <ArrowRight size={19} />
          </button>
        </form>
        <button className="game-auth-demo" type="button" onClick={handleDemoAccount}>
          <Sparkles size={16} /> {t('v2.demoProfile')}
        </button>
      </section>
    </AuthLayout>
  );
};

