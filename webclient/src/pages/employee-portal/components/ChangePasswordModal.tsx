import React, { useState } from 'react';
import { GlobalModal } from '@/components/common/GlobalModal';
import { SaveButton, CancelButton } from '@/components/common/GlobalActionButtons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { KeyRound } from 'lucide-react';
import { authService } from '@/services/authService';
import { toast } from 'sonner';

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
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setErrorMsg('ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៨ តួអក្សរ');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('ការបញ្ជាក់ពាក្យសម្ងាត់ថ្មីមិនត្រូវគ្នាទេ');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
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
        'ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវ ឬមានបញ្ហាក្នុងការប្តូរពាក្យសម្ងាត់';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GlobalModal
      open={open}
      onOpenChange={onOpenChange}
      title="ប្តូរពាក្យសម្ងាត់"
      description="សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន និងពាក្យសម្ងាត់ថ្មី (យ៉ាងតិច ៨ តួអក្សរ)"
      icon={<KeyRound className="size-5" />}
      iconVariant="teal"
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <CancelButton onClick={() => onOpenChange(false)} label="បោះបង់" />
          <SaveButton
            type="submit"
            form="change-password-form"
            loading={submitting}
            label="រក្សាទុកពាក្យសម្ងាត់ថ្មី"
            className="bg-emerald-600 hover:bg-emerald-700"
          />
        </div>
      }
    >
      <form id="change-password-form" onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <Alert variant="destructive">
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="current-password">ពាក្យសម្ងាត់បច្ចុប្បន្ន *</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-password">ពាក្យសម្ងាត់ថ្មី *</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">បញ្ជាក់ពាក្យសម្ងាត់ថ្មី *</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
      </form>
    </GlobalModal>
  );
};
