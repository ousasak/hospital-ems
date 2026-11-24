import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/authService';
import { toast } from 'sonner';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៦ ខ្ទង់');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('ពាក្យសម្ងាត់ថ្មី និងការបញ្ជាក់ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      toast.success('បានប្តូរពាក្យសម្ងាត់ដោយជោគជ័យ!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onOpenChange(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.current_password?.[0] ||
        'មិនអាចប្តូរពាក្យសម្ងាត់បានទេ។ សូមពិនិត្យពាក្យសម្ងាត់ចាស់របស់អ្នក។';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 rounded-2xl border-border bg-background shadow-2xl">
        <div className="px-6 pt-6 pb-4 border-b border-border/80">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg">
            <span className="text-xl">🔒</span>
            <h2>ប្តូរពាក្យសម្ងាត់</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន និងពាក្យសម្ងាត់ថ្មីយ៉ាងតិច ៦ ខ្ទង់
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              ពាក្យសម្ងាត់បច្ចុប្បន្ន <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="បញ្ចូលពាក្យសម្ងាត់ចាស់"
                className="w-full h-10 px-3 pr-10 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              ពាក្យសម្ងាត់ថ្មី <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="យ៉ាងតិច ៦ ខ្ទង់"
                className="w-full h-10 px-3 pr-10 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              បញ្ជាក់ពាក្យសម្ងាត់ថ្មី <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="វាយបញ្ចូលពាក្យសម្ងាត់ថ្មីម្តងទៀត"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs rounded-lg"
            >
              បោះបង់
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
              <span>ផ្លាស់ប្តូរ</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordModal;
