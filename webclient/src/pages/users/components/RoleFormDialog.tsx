import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Key,
  Layers,
  Search,
  Check,
  Loader2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import { Role, Permission, RoleFormData } from '../types';
import { groupPermissionsByModule } from '../utils/permissionModules';
import { GlobalModal } from '@/components/common/GlobalModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface RoleFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoleFormData) => Promise<void>;
  editingRole: Role | null;
  permissions: Permission[];
  isLoading: boolean;
}

export const RoleFormDialog: React.FC<RoleFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingRole,
  permissions,
  isLoading,
}) => {
  const { t } = useTranslation();

  const [form, setForm] = useState<RoleFormData>({
    name: '',
    description: '',
    permissions: [],
  });
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSystemRole = Boolean(editingRole?.is_system);

  useEffect(() => {
    if (editingRole) {
      setForm({
        name: editingRole.name,
        description: '',
        permissions: (editingRole.permissions || []).map((p) => p.name),
      });
    } else {
      setForm({
        name: '',
        description: '',
        permissions: [],
      });
    }
    setSearch('');
    setErrorMsg(null);
  }, [editingRole, isOpen]);

  // Group permissions by module
  const moduleGroups = useMemo(() => {
    return groupPermissionsByModule(permissions);
  }, [permissions]);

  // Filter module groups by search
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return moduleGroups;
    const q = search.toLowerCase();
    return moduleGroups
      .map((group) => {
        const titleMatch =
          t(group.titleKey, group.defaultTitle).toLowerCase().includes(q) ||
          group.key.toLowerCase().includes(q);
        const matched = group.permissions.filter((p) =>
          p.name.toLowerCase().includes(q)
        );
        if (titleMatch) return group;
        if (matched.length > 0) {
          return { ...group, permissions: matched };
        }
        return null;
      })
      .filter(Boolean) as typeof moduleGroups;
  }, [moduleGroups, search, t]);

  const handleTogglePerm = (name: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(name)
        ? prev.permissions.filter((p) => p !== name)
        : [...prev.permissions, name],
    }));
  };

  const handleToggleModule = (moduleKey: string) => {
    const group = moduleGroups.find((g) => g.key === moduleKey);
    if (!group) return;

    const groupPermNames = group.permissions.map((p) => p.name);
    const allSelected = groupPermNames.every((name) => form.permissions.includes(name));

    setForm((prev) => {
      let next: string[];
      if (allSelected) {
        next = prev.permissions.filter((n) => !groupPermNames.includes(n));
      } else {
        const set = new Set([...prev.permissions, ...groupPermNames]);
        next = Array.from(set);
      }
      return { ...prev, permissions: next };
    });
  };

  const handleSelectAll = () => {
    setForm((prev) => ({
      ...prev,
      permissions: permissions.map((p) => p.name),
    }));
  };

  const handleDeselectAll = () => {
    setForm((prev) => ({
      ...prev,
      permissions: [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.name.trim()) {
      setErrorMsg(t('users.messages.nameRequired', 'សូមបញ្ចូលឈ្មោះតួនាទី'));
      return;
    }

    try {
      await onSubmit(form);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || t('users.messages.actionFailed', 'ប្រតិបត្តិការបរាជ័យ'));
    }
  };

  return (
    <GlobalModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      preventClose={isLoading}
      size="2xl"
      icon={<Shield size={20} />}
      title={
        editingRole
          ? t('users.dialog.editRoleTitle', 'កែប្រែតួនាទី')
          : t('users.dialog.createRoleTitle', 'បង្កើតតួនាទីថ្មី')
      }
      description={
        editingRole
          ? t('users.dialog.editRoleDesc', 'កែប្រែឈ្មោះ និងសិទ្ធិប្រតិបត្តិការនៃតួនាទីនេះ។')
          : t('users.dialog.createRoleDesc', 'បង្កើតតួនាទីថ្មី និងកំណត់សិទ្ធិប្រតិបត្តិការតាមតម្រូវការ។')
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
            form="role-form-dialog"
            size="sm"
            disabled={isLoading}
            className="h-9 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs cursor-pointer gap-1.5"
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {editingRole
              ? t('common.saveChanges', 'រក្សាទុកការកែប្រែ')
              : t('users.actions.addRole', 'បង្កើតតួនាទី')}
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

      <form id="role-form-dialog" onSubmit={handleSubmit} className="space-y-5">
          {/* Role Basic Info */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="rf-name" className="text-xs font-medium text-foreground block">
                {t('users.columns.roleName', 'ឈ្មោះតួនាទី')} <span className="text-destructive">*</span>
              </label>
              <Input
                id="rf-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('users.roles.roleNamePlaceholder', 'ឧ. Inventory Manager')}
                disabled={isSystemRole}
                className={`h-9 text-xs sm:text-sm ${isSystemRole ? 'bg-muted cursor-not-allowed' : ''}`}
                required
              />
              {isSystemRole && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                  <Lock className="h-3 w-3 text-amber-500" />
                  {t('users.roles.systemRoleProtected', 'តួនាទីប្រព័ន្ធមិនអាចប្តូរឈ្មោះបានទេ')}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground block">
                {t('users.columns.description', 'ការពិពណ៌នា')}
              </label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t('users.roles.roleDescPlaceholder', 'ពណ៌នាអំពីគោលបំណងនៃតួនាទីនេះ...')}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <Separator />

          {/* Module Permissions Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  {t('users.form.rolePermissions', 'សិទ្ធិចូលប្រើប្រាស់តាមម៉ូឌុល')}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {t('users.form.rolePermissionsSub', 'ជ្រើសរើសសិទ្ធិប្រតិបត្តិការសម្រាប់តួនាទីនេះ')}
                </p>
              </div>

              {/* Selection Summary and Controls */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Badge variant="outline" className="text-[11px] font-mono">
                  {t('users.roles.selectedCount', { count: form.permissions.length }, `${form.permissions.length} សិទ្ធិ`)}
                  {' / '}
                  {permissions.length}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 text-[11px] px-2"
                >
                  {t('users.actions.selectAll', 'ជ្រើសទាំងអស់')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="h-7 text-[11px] px-2"
                >
                  {t('users.actions.deselectAll', 'ដោះទាំងអស់')}
                </Button>
              </div>
            </div>

            {/* Permissions Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('users.roles.searchPermissions', 'ស្វែងរកសិទ្ធិ...')}
                className="pl-9 h-8 text-xs bg-muted/30"
              />
            </div>

            {/* Grouped Permission Cards */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {filteredGroups.map((group) => {
                const groupPermNames = group.permissions.map((p) => p.name);
                const allSelected =
                  groupPermNames.length > 0 &&
                  groupPermNames.every((n) => form.permissions.includes(n));
                const someSelected =
                  !allSelected &&
                  groupPermNames.some((n) => form.permissions.includes(n));

                return (
                  <div
                    key={group.key}
                    className="rounded-xl border border-border bg-card p-3 space-y-2.5 transition-colors hover:border-border/80"
                  >
                    {/* Module Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Layers className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          {t(group.titleKey, group.defaultTitle)}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ({group.permissions.filter((p) => form.permissions.includes(p.name)).length}/
                          {group.permissions.length})
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleModule(group.key)}
                        className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        {allSelected ? (
                          <span className="text-primary font-semibold flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            {t('common.selected', 'បានជ្រើស')}
                          </span>
                        ) : (
                          t('users.actions.selectAllInModule', 'ជ្រើសទាំងអស់')
                        )}
                      </Button>
                    </div>

                    {/* Module Permissions Checkbox Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {group.permissions.map((p) => {
                        const isChecked = form.permissions.includes(p.name);
                        return (
                          <label
                            key={p.name}
                            className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? 'border-primary/40 bg-primary/5 text-foreground'
                                : 'border-border/60 bg-muted/20 hover:bg-muted/40 text-muted-foreground'
                            }`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => handleTogglePerm(p.name)}
                              className="mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="font-mono text-[11px] block truncate" title={p.name}>
                                {p.name}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>
    </GlobalModal>
  );
};
