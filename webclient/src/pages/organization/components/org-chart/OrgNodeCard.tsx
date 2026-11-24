import React, { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Phone, 
  Mail, 
  MoreHorizontal, 
  ExternalLink,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useLocaleStore } from '@/stores/localeStore';
import { getAbsoluteImageUrl } from '@/utils/image';

export interface DepartmentNode {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  parent_id?: number | null;
  manager_id?: number | null;
  status?: string;
  level?: number;
  employee_count?: number;
  children_count?: number;
  total_subtree_employees?: number;
  manager?: {
    id: number;
    full_name: string;
    first_name?: string;
    last_name?: string;
    employee_code?: string;
    email?: string;
    phone?: string;
    avatar_url?: string | null;
    employment_status?: string;
    primary_assignment?: {
      position?: {
        id: number;
        title: string;
      };
    };
  } | null;
  positions?: Array<{
    id: number;
    title: string;
    level?: string;
  }>;
  children?: DepartmentNode[];
}

interface OrgNodeCardProps {
  dept: DepartmentNode;
  level?: number;
  isHighlighted?: boolean;
  isSelected?: boolean;
  onSelect?: (dept: DepartmentNode) => void;
}

export const OrgNodeCard: React.FC<OrgNodeCardProps> = ({
  dept,
  level = 1,
  isHighlighted = false,
  isSelected = false,
  onSelect,
}) => {
  const { t } = useLocaleStore();

  const manager = dept.manager;
  const managerName = manager?.full_name || t('organization.unassignedLead', 'មិនទាន់ចាត់តាំងប្រធាន');
  const managerCode = manager?.employee_code || '';
  const managerPhone = manager?.phone || '';
  const managerEmail = manager?.email || '';
  const managerPosition =
    manager?.primary_assignment?.position?.title ||
    dept.positions?.[0]?.title ||
    (level === 1
      ? t('organization.hospitalDirector', 'ប្រធានមន្ទីរពេទ្យ')
      : level === 2
      ? t('organization.divisionHead', 'ប្រធានផ្នែកដឹកនាំ')
      : level === 3
      ? t('organization.departmentHead', 'ប្រធានផ្នែក')
      : t('organization.unitLead', 'ប្រធានផ្នែក/អគារ'));

  const isActive = manager?.employment_status === 'active';

  // Format initials clearly (Khmer & English)
  const initials = useMemo(() => {
    if (!manager) return null;
    if (manager.first_name && manager.last_name) {
      return `${manager.first_name[0]}.${manager.last_name[0]}`;
    }
    const name = manager.full_name || '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}.${parts[parts.length - 1][0]}`;
    }
    return name.slice(0, 2) || null;
  }, [manager]);

  // Resolve absolute image URL if avatar exists
  const avatarSrc = manager?.avatar_url ? getAbsoluteImageUrl(manager.avatar_url) : null;

  // Hierarchy styling by level
  // Level 1: Deep Navy Blue (#0c3558)
  // Level 2: Cyan / Ocean Blue (#0288d1)
  // Level 3: Olive / Lime / Emerald (#7da013)
  // Level 4: Violet / Rose (#7c3aed)
  const getHierarchyConfig = (lvl: number) => {
    switch (lvl) {
      case 1:
        return {
          bannerBg: 'bg-[#0c3558] text-white dark:bg-slate-900',
          accentRing: 'ring-[#0c3558]/30',
          fallbackBg: 'bg-[#0c3558] text-white',
          defaultTitle: t('organization.hospitalDirector', 'ប្រធានមន្ទីរពេទ្យ'),
        };
      case 2:
        return {
          bannerBg: 'bg-[#0288d1] text-white dark:bg-sky-700',
          accentRing: 'ring-[#0288d1]/30',
          fallbackBg: 'bg-[#0288d1] text-white',
          defaultTitle: t('organization.divisionHead', 'ប្រធានផ្នែកដឹកនាំ'),
        };
      case 3:
        return {
          bannerBg: 'bg-[#7da013] text-white dark:bg-emerald-700',
          accentRing: 'ring-[#7da013]/30',
          fallbackBg: 'bg-[#7da013] text-white',
          defaultTitle: t('organization.departmentHead', 'ប្រធានផ្នែក'),
        };
      default:
        return {
          bannerBg: 'bg-[#7c3aed] text-white dark:bg-purple-700',
          accentRing: 'ring-[#7c3aed]/30',
          fallbackBg: 'bg-[#7c3aed] text-white',
          defaultTitle: t('organization.unitLead', 'ប្រធានផ្នែក/អគារ'),
        };
    }
  };

  const config = getHierarchyConfig(level);
  const displayTitle = managerPosition || config.defaultTitle;

  return (
    <div
      onClick={() => onSelect?.(dept)}
      className={`group relative flex w-[320px] sm:w-[335px] rounded-xl border transition-all duration-200 cursor-pointer select-none bg-card overflow-hidden shadow-xs hover:shadow-md ${
        isSelected
          ? 'ring-2 ring-primary border-primary shadow-md'
          : isHighlighted
          ? 'ring-2 ring-amber-500 border-amber-500 shadow-md bg-amber-50/15 dark:bg-amber-950/20'
          : 'border-slate-300/80 dark:border-slate-700/80 hover:border-primary/60'
      }`}
    >
      {/* ======================================================== */}
      {/* LEFT SECTION: PROMINENT AVATAR & CODE                    */}
      {/* ======================================================== */}
      <div className="w-[100px] sm:w-[108px] shrink-0 p-2.5 bg-slate-50/70 dark:bg-slate-900/60 border-r border-slate-200/70 dark:border-slate-800 flex flex-col items-center justify-center text-center">
        <div className="flex flex-col items-center gap-1.5">
          {/* Avatar with Status indicator */}
          <div className="relative">
            <Avatar className={`size-[72px] sm:size-[78px] ring-2 ${config.accentRing} shadow-xs`}>
              {avatarSrc && (
                <AvatarImage 
                  src={avatarSrc} 
                  alt={managerName} 
                  className="size-full object-cover" 
                />
              )}
              <AvatarFallback className={`size-full text-base sm:text-lg font-extrabold tracking-wide select-none ${config.fallbackBg}`}>
                {initials || <User className="size-7 opacity-75" />}
              </AvatarFallback>
            </Avatar>
            <span
              className={`absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-card ${
                manager
                  ? isActive
                    ? 'bg-emerald-500 ring-1 ring-emerald-500/20'
                    : 'bg-amber-500'
                  : 'bg-slate-400'
              }`}
              title={
                manager
                  ? isActive
                    ? t('organization.activeStaff', 'បុគ្គលិកសកម្ម')
                    : t('organization.inactiveStaff', 'អសកម្ម')
                  : t('organization.unassigned', 'មិនទាន់ចាត់តាំង')
              }
            />
          </div>

          {/* Employee Code */}
          <span className="font-mono text-[10.5px] font-bold text-primary dark:text-primary/90 truncate max-w-[88px]">
            {managerCode || '—'}
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT SECTION: BANNER, DEPT NAME, MANAGER INFO, CONTACTS */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        {/* Top Header Banner with Role/Title */}
        <div className={`px-3 py-1.5 flex items-center justify-between text-[11px] font-bold tracking-wide truncate ${config.bannerBg}`}>
          <span className="truncate">{displayTitle}</span>
          <div className="flex items-center gap-1 shrink-0 ml-1.5">
            {dept.code && (
              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-black/25 text-white">
                {dept.code}
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5 p-0 text-white/80 hover:text-white hover:bg-white/20 rounded"
                >
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem onClick={() => onSelect?.(dept)}>
                  <ExternalLink className="size-3.5 mr-2" />
                  {t('organization.viewDetails', 'មើលព័ត៌មានលម្អិត')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Department Name & Manager */}
        <div className="p-2.5 sm:p-3 space-y-1 min-w-0">
          <div>
            <h4
              className="font-bold text-[11.5px] leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-1"
              title={dept.name}
            >
              {dept.name}
            </h4>
            <p className="font-semibold text-xs text-foreground/90 italic truncate mt-0.5">
              {managerName}
            </p>
          </div>

          {/* Contact Details (Phone & Email) */}
          <div className="space-y-0.5 text-[10.5px] text-muted-foreground pt-0.5">
            {managerPhone ? (
              <div className="flex items-center gap-1.5 truncate">
                <Phone className="size-3 shrink-0 text-muted-foreground/70" />
                <span className="font-mono truncate">{managerPhone}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground/50 text-[10px]">
                <Phone className="size-3 shrink-0 opacity-40" />
                <span>{t('organization.noPhone', 'គ្មានលេខទូរស័ព្ទ')}</span>
              </div>
            )}

            {managerEmail ? (
              <div className="flex items-center gap-1.5 truncate">
                <Mail className="size-3 shrink-0 text-muted-foreground/70" />
                <span className="font-mono truncate">{managerEmail}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground/50 text-[10px]">
                <Mail className="size-3 shrink-0 opacity-40" />
                <span>{t('organization.noEmail', 'គ្មានអ៊ីមែល')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgNodeCard;
