import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Moon,
  Sun,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuthStore } from '../../stores/authStore';
import { useLocaleStore } from '../../stores/localeStore';
import { useThemeStore } from '../../stores/themeStore';
import { useTranslation } from '../../i18n';
import { MorphingSquare } from '../../components/common/MorphingSquare';

const fmt = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, setAuth } = useAuthStore();
  const { locale, setLocale } = useLocaleStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || (location.state as any)?.from || '/';

  const isDark = theme === 'dark';

  const [form, setForm] = useState({
    username: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string>('');
  const [errorParams, setErrorParams] = useState<Record<string, any>>({});
  const [isEnteringDashboard, setIsEnteringDashboard] = useState(false);

  // Ensure no sticky admin email remains in localStorage
  useEffect(() => {
    localStorage.removeItem('ems_username');
  }, []);

  // Rate Limiting & Progressive Lockout State (Single Source of Truth: Backend)
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [isWarning, setIsWarning] = useState(false);
  const [lockUntil, setLockUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  // If already authenticated, redirect
  useEffect(() => {
    if (user && !isEnteringDashboard) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, isEnteringDashboard, from]);

  // Synchronize initial Lockout status with Backend on Page Mount
  useEffect(() => {
    let isMounted = true;
    authService.getLockoutStatus()
      .then((status) => {
        if (!isMounted) return;
        if (status.locked && status.retry_after > 0) {
          const target = Date.now() + status.retry_after * 1000;
          setLockUntil(target);
          setNow(Date.now());
          setFailedAttempts(status.failed_attempts);
          setRemainingAttempts(0);
          setIsWarning(false);
        } else {
          setFailedAttempts(status.failed_attempts);
          setRemainingAttempts(status.remaining_attempts);
          setIsWarning(Boolean(status.warning));
        }
      })
      .catch(() => {
        // Fallback silently if offline or initial load is blocked
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (!lockUntil) return;
    const iv = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= lockUntil) {
        setLockUntil(0);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [lockUntil]);

  const lockRemaining = lockUntil ? Math.max(0, Math.ceil((lockUntil - now) / 1000)) : 0;
  const locked = lockRemaining > 0;

  // Verify account lockout status when username field loses focus
  const checkAccountLockout = async (accountIdentifier: string) => {
    const trimmed = accountIdentifier.trim();
    if (!trimmed) return;
    try {
      const status = await authService.getLockoutStatus(trimmed);
      if (status.locked && status.retry_after > 0) {
        setLockUntil(Date.now() + status.retry_after * 1000);
        setNow(Date.now());
        setFailedAttempts(status.failed_attempts);
        setRemainingAttempts(0);
        setIsWarning(false);
      } else {
        setFailedAttempts(status.failed_attempts);
        setRemainingAttempts(status.remaining_attempts);
        setIsWarning(Boolean(status.warning));
      }
    } catch {
      // Ignore background check errors
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.info(t('auth.forgotPasswordHint'), { icon: 'ℹ️' });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || loading) return;

    const trimmedUsername = form.username.trim();
    const rawPassword = form.password;

    if (!trimmedUsername || !rawPassword) {
      setErrorKey('auth.enterBothCredentials');
      setErrorParams({});
      return;
    }

    setErrorKey('');
    setErrorParams({});
    setLoading(true);

    try {
      // Authenticate against real backend database records with actual credentials via standardized authService
      const response = await authService.login({
        email: trimmedUsername,
        username: trimmedUsername,
        password: rawPassword,
      });

      const responseData = (response as any)?.data || response;
      const token = responseData?.access_token || responseData?.token || (response as any)?.token;
      const userData = responseData?.user || (response as any)?.user;

      if (!token || !userData) {
        throw new Error('Invalid authentication response from server');
      }

      if (rememberMe) {
        localStorage.setItem('ems_username', trimmedUsername);
      } else {
        localStorage.removeItem('ems_username');
      }

      setAuth(userData, token);
      toast.success(t('auth.welcomeUser', { name: userData.name }));

      // Reset lockout counters on success
      setFailedAttempts(0);
      setRemainingAttempts(3);
      setIsWarning(false);
      setLockUntil(0);

      // Trigger MorphingSquare transition
      setIsEnteringDashboard(true);
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
    } catch (err: any) {
      const status = err?.response?.status;
      const responseData = err?.response?.data || {};
      const backendMessage = (
        responseData?.message ||
        responseData?.detail ||
        ''
      ).toLowerCase();

      if (status === 429) {
        const retryAfter = Number(responseData?.retry_after || err?.response?.headers?.['retry-after'] || 30);
        const serverFailed = Number(responseData?.failed_attempts || 3);
        setLockUntil(Date.now() + retryAfter * 1000);
        setNow(Date.now());
        setFailedAttempts(serverFailed);
        setRemainingAttempts(0);
        setIsWarning(false);
        setErrorKey('');
      } else if (status === 401) {
        const serverFailed = Number(responseData?.failed_attempts || failedAttempts + 1);
        const serverRemaining = Number(responseData?.remaining_attempts ?? Math.max(0, 3 - serverFailed));
        const serverWarning = Boolean(responseData?.warning || serverRemaining === 1);

        setFailedAttempts(serverFailed);
        setRemainingAttempts(serverRemaining);
        setIsWarning(serverWarning);

        if (serverWarning) {
          setErrorKey('auth.warningRemainingAttempts');
        } else {
          setErrorKey('auth.invalidCredentials');
        }
      } else if (
        status === 403 ||
        backendMessage.includes('deactivated') ||
        backendMessage.includes('suspended')
      ) {
        setErrorKey('auth.accountDeactivated');
      } else if (status === 422) {
        if (backendMessage.includes('invalid') || backendMessage.includes('credential')) {
          setErrorKey('auth.invalidCredentials');
        } else {
          setErrorKey('auth.enterBothCredentials');
        }
      } else if (!err?.response || status >= 500) {
        setErrorKey('auth.serverError');
      } else {
        setErrorKey('auth.authFailed');
      }
      setErrorParams({});
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page-section">
      {/* Floating Controls (Top Right: Language Switcher & Theme Toggle) */}
      <div className="fixed top-4 right-4 z-20 flex items-center gap-2">
        {/* Language Switcher with Flag Icon */}
        <button
          type="button"
          onClick={() => setLocale(locale === 'km' ? 'en' : 'km')}
          className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          title={t(locale === 'km' ? 'auth.switchToEnglish' : 'auth.switchToKhmer')}
        >
          {locale === 'km' ? (
            <>
              <span className="text-base leading-none">🇰🇭</span>
              <span>ភាសាខ្មែរ</span>
            </>
          ) : (
            <>
              <span className="text-base leading-none">🇬🇧</span>
              <span>English</span>
            </>
          )}
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="size-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
        >
          {isDark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4" />}
        </button>
      </div>

      {/* Centered Login Card */}
      <div className="auth-form-wrapper">
        <div className="auth-form-container">
          {/* Top Logo & Hospital Brand Header */}
          <div className="auth-logo-wrapper text-center">
            <div className="relative inline-flex items-center justify-center rounded-full bg-white shadow-xs border border-slate-200/90 dark:border-slate-700 p-1 mb-3 ring-4 ring-emerald-500/15">
              <img
                src="/hospital-logo.png"
                alt={t('auth.hospitalFullName')}
                className="auth-logo-img rounded-full"
                loading="eager"
              />
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="inline-flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('auth.hospitalBrand')}
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {t('auth.title')}
              </span>
            </div>
          </div>

          {/* Heading & Subtitle */}
          <h4 className="fw-bold mb-2 text-slate-900 dark:text-white font-bold text-xl sm:text-2xl text-center">
            {t('auth.signInHeading')}
          </h4>
          <p className="mb-6 text-slate-500 dark:text-slate-400 text-sm text-center">
            {t('auth.signInSubtitle')}
          </p>

          {/* Error / Warning Message Banner */}
          {errorKey && !locked && (
            <div
              className={`alert d-flex align-items-center gap-2.5 py-2.5 px-4 rounded-[10px] text-sm mb-4 border flex animate-in fade-in duration-200 ${
                isWarning
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900/50 text-amber-800 dark:text-amber-300'
                  : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400'
              }`}
            >
              <AlertCircle className={`size-5 shrink-0 ${isWarning ? 'text-amber-500' : 'text-red-500'}`} />
              <div className="flex-1 font-medium">
                {t(errorKey, errorParams)}
                {!isWarning && remainingAttempts > 0 && remainingAttempts < 3 && (
                  <span className="block text-xs mt-0.5 opacity-90 font-normal">
                    {t('auth.attemptsRemaining', { count: remainingAttempts })}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Lockout Notification Message */}
          {locked && (
            <div className="alert alert-danger d-flex align-items-center gap-2.5 py-2.5 px-4 rounded-[10px] text-sm mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 flex animate-in fade-in duration-200">
              <Lock className="size-5 shrink-0 text-red-500" />
              <div className="flex-1">
                <span className="font-semibold block">{t('auth.accountLocked')}</span>
                <div className="text-xs font-mono mt-0.5">
                  {t('auth.tryAgainIn', { time: fmt(lockRemaining) })}
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            {/* Email / Username Field */}
            <div className="mb-3.5">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                {t('auth.emailOrUsername')} <span className="text-red-500">*</span>
              </label>
              <div className="auth-input-field">
                <Mail className="input-icon" />
                <input
                  type="text"
                  className="auth-input-control"
                  placeholder={t('auth.emailPlaceholder')}
                  value={form.username}
                  onChange={(e) => {
                    setForm({ ...form, username: e.target.value });
                    if (errorKey) setErrorKey('');
                  }}
                  onBlur={() => checkAccountLockout(form.username)}
                  autoComplete="off"
                  disabled={locked}
                  required
                />
              </div>
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div className="mb-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                  {t('auth.password')} <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
              <div className="auth-input-field">
                <Lock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input-control"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={form.password}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value });
                    if (errorKey) setErrorKey('');
                  }}
                  autoComplete="current-password"
                  disabled={locked}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={t(showPassword ? 'auth.hidePassword' : 'auth.showPassword')}
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 dark:bg-slate-800/40"
                />
                <span>{t('auth.rememberMe')}</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || locked}
              className="auth-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  <span>{t('auth.authenticating')}</span>
                </>
              ) : locked ? (
                `${t('auth.accountLocked')} (${fmt(lockRemaining)})`
              ) : (
                t('auth.signIn')
              )}
            </button>
          </form>

          {/* Footer Copyright */}
          <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-6 pt-2">
            {t('auth.copyright')}
          </div>
        </div>
      </div>

      {/* MorphingSquare Loading Screen before entering Dashboard */}
      {isEnteringDashboard && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300 select-none">
          <MorphingSquare
            className="w-12 h-12 bg-blue-600 shadow-xl shadow-blue-500/30"
            message={t('auth.preparingPortal')}
            messagePlacement="bottom"
          />
        </div>
      )}
    </section>
  );
};

export default LoginPage;
