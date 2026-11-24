import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Moon,
  Sun,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  UserPlus,
  CalendarCheck,
  CalendarDays,
  Clock,
  Building2,
  Stethoscope,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useLocaleStore } from '../../stores/localeStore';
import { CommandPalette } from '../../components/common/CommandPalette';
import { NotificationCenter } from '../../components/common/NotificationCenter';
import { UserMenu } from '../../components/common/UserMenu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { cn } from '@/utils';

interface HeaderProps {
  onToggleSidebar: () => void;
}

interface BreadcrumbItem {
  label: string;
  path: string;
  isLast?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { hasRole } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { locale, setLocale, t } = useLocaleStore();
  const [commandOpen, setCommandOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isHR = hasRole(['Super Admin', 'HR Manager', 'HR Staff']);

  // Dynamic KHPosCommerce-style Inline Breadcrumbs (Hospital-specific)
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const path = location.pathname;

    if (path === '/' || path === '/index') {
      return [];
    }
    if (path.startsWith('/profile')) {
      return [
        { label: 'ព័ត៌មានគណនី & ប្រវត្តិរូប', path: '/profile', isLast: true },
      ];
    }
    if (path.startsWith('/employees')) {
      return [
        { label: t('nav.employees', 'គ្រប់គ្រងបុគ្គលិក'), path: '/employees' },
        { label: t('employees.employeeListTitle', 'បញ្ជីបុគ្គលិក'), path: '/employees', isLast: true },
      ];
    }
    if (path.startsWith('/assignments')) {
      return [
        { label: t('nav.employees', 'គ្រប់គ្រងបុគ្គលិក'), path: '/employees' },
        { label: t('nav.assignments', 'ការចាត់តាំងការងារ'), path: '/assignments', isLast: true },
      ];
    }
    if (path.startsWith('/organization/departments')) {
      return [
        { label: t('nav.orgStructure', 'រចនាសម្ព័ន្ធស្ថាប័ន'), path: '/organization/departments' },
        { label: t('nav.departments', 'ដេប៉ាតឺម៉ង់ / ផ្នែក'), path: '/organization/departments', isLast: true },
      ];
    }
    if (path.startsWith('/organization/positions')) {
      return [
        { label: t('nav.orgStructure', 'រចនាសម្ព័ន្ធស្ថាប័ន'), path: '/organization/departments' },
        { label: t('nav.positions', 'មុខតំណែង / តួនាទី'), path: '/organization/positions', isLast: true },
      ];
    }
    if (path.startsWith('/organization/locations')) {
      return [
        { label: t('nav.orgStructure', 'រចនាសម្ព័ន្ធស្ថាប័ន'), path: '/organization/departments' },
        { label: t('nav.workLocations', 'ទីតាំង / អគារពេទ្យ'), path: '/organization/locations', isLast: true },
      ];
    }
    if (path.startsWith('/organization/chart')) {
      return [
        { label: t('nav.orgStructure', 'រចនាសម្ព័ន្ធស្ថាប័ន'), path: '/organization/departments' },
        { label: t('nav.orgChart', 'គំនូសតាងស្ថាប័ន'), path: '/organization/chart', isLast: true },
      ];
    }
    if (path.startsWith('/attendance')) {
      return [
        { label: t('nav.timeAttendance', 'ពេលវេលា & វត្តមាន'), path: '/attendance' },
        { label: t('nav.attendance', 'កត់ត្រាវត្តមាន'), path: '/attendance', isLast: true },
      ];
    }
    if (path.startsWith('/shifts')) {
      return [
        { label: t('nav.timeAttendance', 'ពេលវេលា & វត្តមាន'), path: '/attendance' },
        { label: t('nav.workShifts', 'វេនការងារពេទ្យ'), path: '/shifts', isLast: true },
      ];
    }
    if (path.startsWith('/leaves') || path.startsWith('/leave')) {
      return [
        { label: t('nav.timeAttendance', 'ពេលវេលា & វត្តមាន'), path: '/attendance' },
        { label: t('nav.leaveManagement', 'ច្បាប់ឈប់សម្រាក'), path: '/leaves', isLast: true },
      ];
    }
    if (path.startsWith('/payroll')) {
      return [
        { label: t('nav.financePayroll', 'ហិរញ្ញវត្ថុ & ប្រាក់ខែ'), path: '/payroll' },
        { label: t('nav.payroll', 'ប្រាក់បៀវត្ស'), path: '/payroll', isLast: true },
      ];
    }
    if (path.startsWith('/recruitment')) {
      return [
        { label: t('nav.recruitment', 'ជ្រើសរើសបុគ្គលិក'), path: '/recruitment' },
        { label: t('recruitment.title', 'ការងារទំនេរ'), path: '/recruitment', isLast: true },
      ];
    }
    if (path.startsWith('/performance')) {
      return [
        { label: t('nav.performance', 'ការវាយតម្លៃ & KPI'), path: '/performance' },
        { label: t('performance.title', 'សមិទ្ធផលការងារ'), path: '/performance', isLast: true },
      ];
    }
    if (path.startsWith('/documents')) {
      return [
        { label: t('nav.documents', 'ឯកសារបុគ្គលិក'), path: '/documents' },
        { label: t('documents.title', 'បញ្ជីឯកសារ'), path: '/documents', isLast: true },
      ];
    }
    if (path.startsWith('/reports')) {
      return [
        { label: t('nav.reports', 'របាយការណ៍'), path: '/reports' },
        { label: t('reports.title', 'ទិន្នន័យទូទៅ'), path: '/reports', isLast: true },
      ];
    }
    if (path.startsWith('/users')) {
      return [
        { label: t('nav.security', 'សុវត្ថិភាព & សិទ្ធិ'), path: '/users' },
        { label: t('nav.usersRoles', 'អ្នកប្រើប្រាស់'), path: '/users', isLast: true },
      ];
    }
    if (path.startsWith('/settings')) {
      return [
        { label: t('nav.systemSettings', 'ការកំណត់ប្រព័ន្ធ'), path: '/settings' },
        { label: t('settings.general', 'ទូទៅ'), path: '/settings', isLast: true },
      ];
    }
    return [];
  };

  const breadcrumbs = getBreadcrumbItems();

  return (
    <>
      {/* ─── Harmonized Top Navbar Header (Deep Medical Pine Theme matching Sidebar #0a1e1d) ─── */}
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between bg-[#0c2423] dark:bg-[#071918] text-white px-3 sm:px-4 lg:px-6 shadow-xs border-b border-[#143d3a] transition-colors">
        
        {/* Left Section: Mobile Menu Toggle & Inline Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8ea39f] hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            title="Toggle Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Inline Breadcrumbs with Hospital Tone */}
          <nav className="flex items-center gap-1.5 text-xs text-[#8ea39f] whitespace-nowrap overflow-hidden">
            <Link
              to="/"
              className="flex items-center gap-1 text-[#8ea39f] hover:text-white transition-colors font-medium truncate"
            >
              <span>{t('header.dashboard', 'ផ្ទាំងគ្រប់គ្រង')}</span>
            </Link>

            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                <ChevronRight className="h-3 w-3 text-[#3f635f] shrink-0" />
                {item.isLast ? (
                  <span className="font-semibold text-white truncate max-w-[140px] sm:max-w-[200px]">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.path}
                    className="text-[#8ea39f] hover:text-white transition-colors truncate max-w-[120px]"
                  >
                    {item.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Search Trigger inside Center Bar (KHPosCommerce signature placement, Hospital-tuned) */}
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="relative hidden md:flex items-center justify-between h-8 w-52 lg:w-72 rounded-lg bg-[#071a19]/80 hover:bg-[#071a19] border border-[#1b4b47] px-2.5 text-xs text-white shadow-inner transition-colors group cursor-pointer shrink-0 ml-2"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Search className="h-3.5 w-3.5 text-[#6c918c] group-hover:text-emerald-400 transition-colors shrink-0" />
              <span className="text-[#6c918c] group-hover:text-emerald-200 transition-colors text-[11px] truncate">
                {t('header.searchWorkspaceHospital', 'ស្វែងរកបុគ្គលិក, ផ្នែក, ឬឯកសារ...')}
              </span>
            </div>
            <kbd className="pointer-events-none rounded bg-[#0e2c29] border border-[#235853] px-1 py-0.2 text-[9px] font-mono text-emerald-300 shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Section: Quick Add, Language Selector, Theme, Notifications, User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* 1. Quick Add Button (+ បន្ថែមរហ័ស - Hospital Actions) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 px-3 text-xs font-semibold text-white shadow-xs border border-emerald-400/30 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">{t('header.quickAdd', 'បន្ថែមរហ័ស')}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-xl bg-card border-border">
              <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {t('header.quickActionsHospital', 'សកម្មភាពរហ័សមន្ទីរពេទ្យ')}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {isHR && (
                <DropdownMenuItem
                  onClick={() => navigate('/employees?action=new')}
                  className="cursor-pointer text-xs"
                >
                  <UserPlus className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                  <span>{t('header.newEmployee', 'បន្ថែមបុគ្គលិកថ្មី')}</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => navigate('/shifts')}
                className="cursor-pointer text-xs"
              >
                <Clock className="mr-2 h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>{t('header.assignShift', 'កាលវិភាគ / វេនការងារ')}</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/attendance')}
                className="cursor-pointer text-xs"
              >
                <CalendarCheck className="mr-2 h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>{t('header.punchAttendance', 'កត់ត្រាវត្តមាន')}</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/leaves?action=new')}
                className="cursor-pointer text-xs"
              >
                <CalendarDays className="mr-2 h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>{t('header.applyLeave', 'ស្នើសុំច្បាប់ឈប់សម្រាក')}</span>
              </DropdownMenuItem>

              {isHR && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate('/organization/departments?action=new')}
                    className="cursor-pointer text-xs"
                  >
                    <Building2 className="mr-2 h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    <span>{t('header.newDepartment', 'បង្កើតដេប៉ាតឺម៉ង់ / ផ្នែកថ្មី')}</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 2. Language Switcher Dropdown (Cambodian Flag 🇰🇭 & English Flag 🇬🇧) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Language Selector"
                className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs font-medium text-white/90 hover:bg-white/15 hover:text-white transition-all cursor-pointer shadow-2xs"
              >
                {locale === 'km' ? (
                  <span className="flex items-center gap-1.5">
                    <span className="text-base leading-none">🇰🇭</span>
                    <span className="text-xs font-semibold">ភាសាខ្មែរ</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span className="text-base leading-none">🇬🇧</span>
                    <span className="text-xs font-semibold">English</span>
                  </span>
                )}
                <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 p-1 bg-card border-border shadow-lg">
              <DropdownMenuItem
                onClick={() => setLocale('km')}
                className={cn(
                  'cursor-pointer text-xs flex items-center justify-between',
                  locale === 'km' && 'font-bold text-emerald-600'
                )}
              >
                <span className="flex items-center gap-2">
                  <span>🇰🇭</span>
                  <span>ភាសាខ្មែរ</span>
                </span>
                {locale === 'km' && <span className="text-emerald-600 text-xs">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLocale('en')}
                className={cn(
                  'cursor-pointer text-xs flex items-center justify-between',
                  locale === 'en' && 'font-bold text-emerald-600'
                )}
              >
                <span className="flex items-center gap-2">
                  <span>🇬🇧</span>
                  <span>English</span>
                </span>
                {locale === 'en' && <span className="text-emerald-600 text-xs">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 3. Theme Toggle (Sun / Moon) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={t('header.toggleTheme', 'ប្តូររូបរាង')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8ea39f] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={t('header.toggleTheme')}
          >
            <Sun className="hidden h-4 w-4 dark:block text-amber-300" />
            <Moon className="h-4 w-4 dark:hidden text-white" />
          </button>

          {/* 4. Notification Center with Red Dot Alert */}
          <NotificationCenter triggerClassName="text-[#8ea39f] hover:text-white hover:bg-white/10 cursor-pointer" />

          {/* 5. User Profile Dropdown Pill */}
          <UserMenu
            showName={false}
            triggerClassName="p-0.5 rounded-full hover:ring-2 hover:ring-emerald-400/40 transition-all cursor-pointer focus:outline-none"
          />
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
};
