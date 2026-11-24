import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocaleStore } from '../../stores/localeStore';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '../ui/command';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  CalendarDays,
  Award,
  Settings,
  UserPlus,
  Clock,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const { t } = useLocaleStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const handleSelect = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t('command.placeholder')} />
      <CommandList>
        <CommandEmpty>{t('command.noResults')}</CommandEmpty>

        <CommandGroup heading={t('command.quickActions')}>
          <CommandItem onSelect={() => handleSelect('/employees?action=new')}>
            <UserPlus className="mr-2 h-4 w-4 text-primary" />
            <span>{t('header.newEmployee')}</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('/attendance')}>
            <Clock className="mr-2 h-4 w-4 text-primary" />
            <span>{t('nav.checkInOut')}</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('/leaves')}>
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            <span>{t('header.applyLeave')}</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t('command.navigation')}>
          <CommandItem onSelect={() => handleSelect('/')}>
            <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{t('nav.dashboard')}</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('/employees')}>
            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{t('nav.employeeDirectory')}</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('/organization/departments')}>
            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{t('nav.departments')}</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('/organization/positions')}>
            <Award className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{t('nav.positions')}</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('/attendance')}>
            <CalendarCheck className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{t('nav.attendanceRecords')}</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('/leaves')}>
            <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{t('nav.leaveManagement')}</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('/reports')}>
            <FileSpreadsheet className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{t('nav.reports')}</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('/settings')}>
            <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{t('nav.systemSettings')}</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

