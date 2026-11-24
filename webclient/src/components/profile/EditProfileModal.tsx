import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Calendar,
  Camera,
  Loader2,
  Phone,
  Building,
  MapPin,
  User as UserIcon,
  Shield,
  Pencil,
  Trash2,
} from 'lucide-react';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emp = (user?.employee || {}) as any;
  const primaryContact = emp?.emergencyContacts?.find(
    (c: any) => c.is_primary || c.relationship === 'guardian'
  ) || emp?.emergency_contacts?.find(
    (c: any) => c.is_primary || c.relationship === 'guardian'
  ) || emp?.emergencyContacts?.[0] || emp?.emergency_contacts?.[0];

  // Form states
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [latinName, setLatinName] = useState('');
  const [gender, setGender] = useState('male');
  const [dob, setDob] = useState('');
  const [city, setCity] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isAvatarDeleted, setIsAvatarDeleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Compute clean text profile initials
  const textProfileInitials = useMemo(() => {
    if (firstName && lastName) {
      return `${firstName.trim()[0]}${lastName.trim()[0]}`.toUpperCase();
    }
    const clean = (latinName || user?.name || '').replace(/^(វេជ្ជ\.|លោក\.|លោកស្រី\.|កញ្ញា\.|វេជ្ជបណ្ឌិត)\s*/i, '').trim();
    if (clean) {
      const parts = clean.split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      return clean.slice(0, 2).toUpperCase();
    }
    return 'EM';
  }, [firstName, lastName, latinName, user?.name]);

  // Synchronize state from user/employee whenever opened or user changes
  useEffect(() => {
    if (open) {
      setIsAvatarDeleted(false);
      const empData = (user?.employee || {}) as any;
      const initialContact = empData?.emergencyContacts?.find(
        (c: any) => c.is_primary || c.relationship === 'guardian'
      ) || empData?.emergency_contacts?.find(
        (c: any) => c.is_primary || c.relationship === 'guardian'
      ) || empData?.emergencyContacts?.[0] || empData?.emergency_contacts?.[0];

      let initialLastName = empData?.last_name || '';
      let initialFirstName = empData?.first_name || '';

      if (!initialLastName && !initialFirstName && user?.name) {
        const parts = user.name.trim().split(/\s+/);
        if (parts.length >= 2) {
          initialLastName = parts[0];
          initialFirstName = parts.slice(1).join(' ');
        } else {
          initialLastName = user.name;
        }
      }

      setLastName(initialLastName);
      setFirstName(initialFirstName);
      setLatinName(user?.name || `${initialLastName} ${initialFirstName}`.trim());

      const g = (empData?.gender || 'male').toLowerCase();
      setGender(g.includes('fem') || g === 'ស្រី' ? 'female' : 'male');

      if (empData?.date_of_birth) {
        try {
          const d = new Date(empData.date_of_birth);
          if (!isNaN(d.getTime())) {
            setDob(d.toISOString().split('T')[0]);
          } else {
            setDob(String(empData.date_of_birth).substring(0, 10));
          }
        } catch {
          setDob('');
        }
      } else {
        setDob('');
      }

      setCity(empData?.city || empData?.address || 'ភ្នំពេញ');
      setDepartment(
        empData?.primaryAssignment?.department?.name ||
          empData?.primary_assignment?.department?.name ||
          (user as any)?.department ||
          'ទីស្នាក់ការកណ្តាល'
      );
      setPhone(empData?.phone || (user as any)?.phone || '');
      setEmergencyPhone(initialContact?.phone || '');
      setAvatarPreview(empData?.avatar_url || user?.avatar_url || (user as any)?.avatar || null);
      setAvatarFile(null);
    }
  }, [open, user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ទំហំរូបភាពមិនត្រូវលើសពី 5MB ឡើយ');
        return;
      }
      setAvatarFile(file);
      setIsAvatarDeleted(false);
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const handleDeleteAvatar = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    setIsAvatarDeleted(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('បានលុបរូបភាព Profile! ប្រព័ន្ធនឹងបង្ហាញអក្សរឈ្មោះសម្គាល់ Profile ជំនួសវិញ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let finalAvatarUrl: string | null = null;

      if (isAvatarDeleted) {
        finalAvatarUrl = '';
        try {
          await authService.removeAvatar();
        } catch (delErr) {
          console.warn('Remove avatar endpoint error (handled via updateProfile):', delErr);
        }
      } else if (avatarFile) {
        try {
          const uploadRes = await authService.uploadAvatar(avatarFile);
          finalAvatarUrl =
            uploadRes?.avatar_url ||
            uploadRes?.data?.avatar_url ||
            uploadRes?.data?.url ||
            null;
        } catch (uploadErr: any) {
          console.error('Avatar upload failed:', uploadErr);
          const uploadErrMsg =
            uploadErr?.response?.data?.message ||
            'មិនអាចផ្ទុកឡើងរូបភាពបានឡើយ។ សូមជ្រើសរើសរូបភាពផ្សេង។';
          toast.error(uploadErrMsg);
          setIsSaving(false);
          return;
        }
      } else {
        const existing = avatarPreview || user?.avatar_url || (user as any)?.avatar;
        if (typeof existing === 'string' && !existing.startsWith('blob:')) {
          finalAvatarUrl = existing;
        } else {
          finalAvatarUrl = '';
        }
      }

      const payload = {
        last_name: lastName.trim(),
        first_name: firstName.trim(),
        name: latinName.trim() || `${lastName} ${firstName}`.trim(),
        gender: gender,
        date_of_birth: dob || null,
        city: city.trim(),
        phone: phone.trim(),
        emergency_contact_phone: emergencyPhone.trim(),
        emergency_contact_name: 'អាណាព្យាបាល / ទំនាក់ទំនងបន្ទាន់',
        avatar_url: finalAvatarUrl ?? '',
      };

      const res = await authService.updateProfile(payload);

      // Update local auth store user
      if (res?.user) {
        updateUser(res.user);
      } else {
        updateUser({
          name: payload.name,
          avatar_url: finalAvatarUrl || null,
          employee: {
            ...user?.employee,
            first_name: payload.first_name,
            last_name: payload.last_name,
            gender: payload.gender,
            date_of_birth: payload.date_of_birth,
            city: payload.city,
            phone: payload.phone,
            avatar_url: finalAvatarUrl || null,
          },
        });
      }

      // Invalidate relevant React Queries
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      queryClient.invalidateQueries({ queryKey: ['portal-auth-me'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['employee-portal'] });
      queryClient.invalidateQueries({ queryKey: ['portal-employee-detail'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });

      toast.success('បានរក្សាទុកព័ត៌មានផ្ទាល់ខ្លួនដោយជោគជ័យ!');
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      const msg =
        err?.response?.data?.message ||
        'មិនអាចរក្សាទុកព័ត៌មានបានទេ។ សូមព្យាយាមម្តងទៀត។';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/80">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg">
            <span className="text-xl">✏️</span>
            <h2>កែព័ត៌មានផ្ទាល់ខ្លួន</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ជំនាញ ឆ្នាំ និងស្ថានភាព មិនអាចកែប្រែដោយខ្លួនឯងបានទេ
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Avatar Preview Row */}
          <div className="flex items-center gap-4 p-3 bg-muted/40 rounded-xl border border-border/60">
            <div className="relative size-14 rounded-full overflow-hidden border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center shrink-0 shadow-sm select-none">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-extrabold text-base tracking-wider">
                  {textProfileInitials}
                </span>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                title="ប្តូររូបភាព"
              >
                <Camera className="size-4" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-foreground">រូបថតបុគ្គលិក</p>
                {!avatarPreview && (
                  <span className="bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.2 rounded-full font-mono">
                    Text Profile ({textProfileInitials})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {avatarPreview
                  ? 'គាំទ្រទម្រង់ JPG, PNG ឬ WebP (ទំហំអតិបរមា 5MB)'
                  : 'គ្មានរូបភាព — ប្រព័ន្ធបង្ហាញអក្សរឈ្មោះសម្គាល់ Profile ដោយស្វ័យប្រវត្តិ'}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs rounded-lg h-8 px-2.5 flex items-center gap-1 cursor-pointer"
              >
                <Camera className="size-3.5" />
                <span>{avatarPreview ? 'ប្តូររូបថត' : 'បញ្ចូលរូបថត'}</span>
              </Button>
              {avatarPreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAvatar}
                  className="text-xs rounded-lg h-8 px-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 flex items-center gap-1 cursor-pointer"
                  title="លុបរូបភាព និងប្រើ Text Profile"
                >
                  <Trash2 className="size-3.5" />
                  <span>លុបរូបភាព</span>
                </Button>
              )}
            </div>
          </div>

          {/* Row 1: នាមត្រកូល & នាម */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                នាមត្រកូល <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="ឧ. សាក់"
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                នាម <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="ឧ. ឧស្សាហ៍"
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Row 2: ឈ្មោះជាអក្សរឡាតាំង */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              ឈ្មោះជាអក្សរឡាតាំង
            </label>
            <input
              type="text"
              value={latinName}
              onChange={(e) => setLatinName(e.target.value)}
              placeholder="ឧ. SAK Ousa"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          {/* Row 3: ភេទ & ថ្ងៃខែឆ្នាំកំណើត */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">ភេទ</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
              >
                <option value="male">ប្រុស</option>
                <option value="female">ស្រី</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <span>ថ្ងៃខែឆ្នាំកំណើត</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Row 4: មកពីខេត្ត/ក្រុង & ដេប៉ាតឺម៉ង់ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                មកពីខេត្ត/ក្រុង
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="ឧ. ត្បូងឃ្មុំ, ភ្នំពេញ..."
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                ដេប៉ាតឺម៉ង់ / ផ្នែក
              </label>
              <input
                type="text"
                disabled
                value={department}
                className="w-full h-10 px-3 rounded-lg border border-border bg-muted/60 text-sm text-muted-foreground cursor-not-allowed select-none"
                title="មិនអាចកែប្រែដេប៉ាតឺម៉ង់ដោយផ្ទាល់ទេ"
              />
            </div>
          </div>

          {/* Row 5: លេខទូរស័ព្ទផ្ទាល់ខ្លួន & លេខទូរស័ព្ទអាណាព្យាបាល / បន្ទាន់ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                លេខទូរស័ព្ទផ្ទាល់ខ្លួន
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ឧ. 0762825595"
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                លេខទូរស័ព្ទអាណាព្យាបាល / ទំនាក់ទំនងបន្ទាន់
              </label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="ឧ. 012 345 678"
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs rounded-lg"
            >
              បោះបង់
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
            >
              {isSaving && <Loader2 className="size-3.5 animate-spin" />}
              <span>រក្សាទុក</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;
