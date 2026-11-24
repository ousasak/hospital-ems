import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CloseButton } from '@/components/common/CloseButton';
import { 
  Building2, 
  Users, 
  UserCheck, 
  GitFork, 
  Briefcase, 
  ArrowRight,
  ShieldCheck,
  Phone,
  Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DepartmentNode } from './OrgNodeCard';
import { useLocaleStore } from '@/stores/localeStore';
import { getAbsoluteImageUrl } from '@/utils/image';

interface DeptDetailDialogProps {
  dept: DepartmentNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeptDetailDialog: React.FC<DeptDetailDialogProps> = ({
  dept,
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const { t } = useLocaleStore();

  const manager = dept?.manager;

  // Format clean initials for Khmer & English
  const managerInitials = useMemo(() => {
    if (!manager) return '??';
    if (manager.first_name && manager.last_name) {
      return `${manager.first_name[0]}.${manager.last_name[0]}`;
    }
    const name = manager.full_name || '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}.${parts[parts.length - 1][0]}`;
    }
    return name.slice(0, 2) || '??';
  }, [manager]);

  if (!dept) return null;

  const employeeCount = dept.employee_count ?? 0;
  const totalSubtree = dept.total_subtree_employees ?? employeeCount;
  const subUnitsCount = dept.children_count ?? dept.children?.length ?? 0;
  const avatarSrc = manager?.avatar_url ? getAbsoluteImageUrl(manager.avatar_url) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-card border border-border shadow-2xl rounded-2xl [&>button:last-child]:hidden font-sans flex flex-col max-h-[88vh]">
        {/* ======================================================== */}
        {/* 1. GLOBAL ENTERPRISE MODAL HEADER                        */}
        {/* ======================================================== */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-row items-center justify-between gap-3 space-y-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 shadow-2xs">
              <Building2 className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground truncate">
                  {dept.name}
                </DialogTitle>
                <Badge variant="default" className="text-[10px] font-semibold uppercase shrink-0">
                  {t('organization.level', 'កម្រិត')} {dept.level || 1}
                </Badge>
                {dept.code && (
                  <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/50 shrink-0">
                    {dept.code}
                  </span>
                )}
              </div>
              {dept.description && (
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 line-clamp-1 text-left">
                  {dept.description}
                </DialogDescription>
              )}
            </div>
          </div>

          {/* Global Standard Close Button with Esc Tooltip */}
          <CloseButton 
            onClose={() => onOpenChange(false)} 
            size="md" 
            variant="default" 
            className="shrink-0"
          />
        </DialogHeader>

        {/* ======================================================== */}
        {/* 2. MODAL BODY (SCROLLABLE CONTENT)                       */}
        {/* ======================================================== */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Manager / Lead Highlight Card */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-2">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-primary" />
              <span>{t('organization.departmentLead', 'ប្រធានគ្រប់គ្រងផ្នែក')}</span>
            </span>
            <div className="flex items-center gap-3.5 pt-1">
              <div className="relative shrink-0">
                <Avatar className="size-14 ring-2 ring-primary/20 shadow-xs">
                  {avatarSrc && (
                    <AvatarImage src={avatarSrc} alt={manager?.full_name} className="size-full object-cover" />
                  )}
                  <AvatarFallback className="size-full bg-primary/10 text-primary font-bold text-sm">
                    {manager ? managerInitials : <UserCheck className="size-5 text-muted-foreground" />}
                  </AvatarFallback>
                </Avatar>
                {manager && (
                  <span
                    className={`absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-card ${
                      manager.employment_status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    {manager?.full_name || t('organization.unassignedLead', 'មិនទាន់ចាត់តាំង')}
                  </h4>
                  <p className="text-xs text-muted-foreground font-medium">
                    {manager?.primary_assignment?.position?.title || dept.positions?.[0]?.title || t('organization.departmentLead', 'ប្រធានផ្នែក')}
                    {manager?.employee_code && (
                      <span className="font-mono text-primary ml-1.5 font-semibold">
                        ({manager.employee_code})
                      </span>
                    )}
                  </p>
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 text-[11px] text-muted-foreground font-mono">
                  {manager?.phone && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="size-3 text-muted-foreground/70 shrink-0" />
                      <span className="truncate">{manager.phone}</span>
                    </div>
                  )}
                  {manager?.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="size-3 text-muted-foreground/70 shrink-0" />
                      <span className="truncate">{manager.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-xl border border-border/70 bg-card shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                {t('organization.directStaff', 'បុគ្គលិកផ្ទាល់')}
              </span>
              <span className="text-base font-bold text-foreground flex items-center justify-center gap-1 mt-1 font-mono">
                <Users className="size-4 text-primary" />
                {employeeCount}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-border/70 bg-card shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                {t('organization.subtreeWorkforce', 'បុគ្គលិកសាខា')}
              </span>
              <span className="text-base font-bold text-foreground flex items-center justify-center gap-1 mt-1 font-mono">
                <Users className="size-4 text-emerald-600" />
                {totalSubtree}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-border/70 bg-card shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                {t('organization.subUnits', 'ផ្នែករង')}
              </span>
              <span className="text-base font-bold text-foreground flex items-center justify-center gap-1 mt-1 font-mono">
                <GitFork className="size-4 text-sky-600" />
                {subUnitsCount}
              </span>
            </div>
          </div>

          {/* Positions in this department */}
          {dept.positions && dept.positions.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Briefcase className="size-3.5 text-primary" />
                <span>
                  {t('organization.positions', 'មុខតំណែង និងតួនាទី')} ({dept.positions.length})
                </span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                {dept.positions.map((pos) => (
                  <div
                    key={pos.id}
                    className="p-2.5 rounded-xl border border-border/60 bg-muted/30 text-xs flex items-center justify-between shadow-2xs"
                  >
                    <span className="font-medium truncate">{pos.title}</span>
                    {pos.level && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 uppercase font-mono">
                        {pos.level}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-departments List */}
          {dept.children && dept.children.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <GitFork className="size-3.5 text-primary" />
                <span>
                  {t('organization.subUnits', 'ផ្នែករង')} ({dept.children.length})
                </span>
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto p-1">
                {dept.children.map((child) => (
                  <div
                    key={child.id}
                    className="p-2.5 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between text-xs shadow-2xs"
                  >
                    <div>
                      <span className="font-semibold text-foreground block">{child.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {child.manager?.full_name || t('organization.unassignedLead', 'មិនទាន់ចាត់តាំង')}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {child.employee_count ?? 0} {t('organization.staff', 'បុគ្គលិក')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 3. GLOBAL MODAL FOOTER                                   */}
        {/* ======================================================== */}
        <div className="p-4 sm:p-5 border-t border-border bg-muted/10 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-medium rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            {t('common.close', 'បិទ')}
          </Button>

          <Button
            variant="default"
            size="sm"
            className="text-xs gap-1.5 rounded-xl font-bold"
            onClick={() => {
              onOpenChange(false);
              navigate('/organization/departments');
            }}
          >
            <span>{t('organization.departments', 'គ្រប់គ្រងផ្នែក')}</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeptDetailDialog;
