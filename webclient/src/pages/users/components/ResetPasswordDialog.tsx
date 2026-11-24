import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Key, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { User } from '../types';
import { GlobalModal } from '@/components/common/GlobalModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ResetPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSubmit: (userId: number, newPassword: string) => Promise<void>;
  isLoading: boolean;
}

export const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  isOpen,
  onClose,
  user,
  onSubmit,
  isLoading,
}) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setErrorMsg(null);
  }, [user, isOpen]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password || password.length < 6) {
      setErrorMsg(t('users.messages.passwordTooShort', 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ'));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(t('users.messages.passwordsDoNotMatch', 'ពាក្យសម្ងាត់ទាំងពីរមិនត្រូវគ្នាទេ'));
      return;
    }

    try {
      await onSubmit(user.id, password);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || t('users.messages.actionFailed', 'ប្រតិបត្តិការបរាជ័យ'));
    }
  };

  return (
    <GlobalModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      preventClose={isLoading}
      size="sm"
      icon={<Key size={20} />}
      title={t('users.dialog.resetPasswordTitle', 'កំណត់ពាក្យសម្ងាត់ឡើងវិញ')}
      description={
        <>
          {t('users.dialog.resetPasswordDesc', 'បញ្ចូលពាក្យសម្ងាត់ថ្មីសម្រាប់គណនី៖')}{' '}
          <strong className="text-foreground">{user.name}</strong> ({user.email})
        </>
      }
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="h-9 px-4 rounded-xl border-border bg-card text-xs font-semibold cursor-pointer hover:bg-muted"
          >
            {t('common.cancel', 'បោះបង់')}
          </Button>
          <Button
            type="submit"
            form="reset-password-form"
            size="sm"
            disabled={isLoading}
            className="h-9 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs cursor-pointer gap-1.5"
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('users.actions.resetPassword', 'កំណត់ពាក្យសម្ងាត់')}
          </Button>
        </>
      }
    >
      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form id="reset-password-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="rp-password" className="text-xs font-medium">
            {t('users.form.newPassword', 'ពាក្យសម្ងាត់ថ្មី')} <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="rp-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pr-9 h-9 text-xs sm:text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('users.messages.passwordTooShort', 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ')}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rp-confirm" className="text-xs font-medium">
            {t('users.form.confirmPassword', 'បញ្ជាក់ពាក្យសម្ងាត់')} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="rp-confirm"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="h-9 text-xs sm:text-sm"
            required
          />
        </div>
      </form>
    </GlobalModal>
  );
};
