import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useAuthStore } from '../../stores/authStore';
import { useLocaleStore } from '../../stores/localeStore';
import { useThemeStore } from '../../stores/themeStore';
import {
  User,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  Globe,
  Sun,
  Moon,
  ClipboardList,
  Building2,
  MapPin,
} from 'lucide-react';
import { cn } from '@/utils';

interface UserMenuProps {
  triggerClassName?: string;
  showName?: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  triggerClassName,
  showName = true,
}) => {
  const { user, logout } = useAuthStore();
  const { locale, setLocale, t } = useLocaleStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (user?.employee?.first_name && user?.employee?.last_name) {
      return `${user.employee.first_name.trim()[0]}${user.employee.last_name.trim()[0]}`.toUpperCase();
    }
    if (!user?.name) return 'SA';
    const clean = user.name.replace(/^(វេជ្ជ\.|លោក\.|លោកស្រី\.|កញ្ញា\.|វេជ្ជបណ្ឌិត)\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const userName = user?.name || 'Super Admin (System Owner)';
  const userEmail = user?.email || 'superadmin@ccfth-ems.gov.kh';
  const roleTitle = t('userMenu.superAdmin', 'អ្នកគ្រប់គ្រងជាន់ខ្ពស់');
  const firstName = user?.name ? user.name.split(' ')[0] : 'Admin';

  const rawAvatar =
    (user as any)?.avatar_url ||
    (user as any)?.employee?.avatar_url ||
    null;
  const avatarUrl = rawAvatar && !rawAvatar.includes('unsplash') ? rawAvatar : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="User Menu"
          className={cn(
            'flex items-center gap-2 rounded-full p-1 transition-all focus-visible:outline-none cursor-pointer',
            triggerClassName || 'hover:bg-black/5 dark:hover:bg-white/5'
          )}
        >
          {/* Avatar Pill Trigger matching KHPosCommerce */}
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-xs font-semibold text-white shadow-xs border border-white/30 ring-2 ring-white/10 hover:ring-white/40 transition-all">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="h-full w-full object-cover"
                loading="eager"
              />
            ) : (
              <span className="font-semibold text-[11px]">{getInitials()}</span>
            )}
          </div>

          {showName && (
            <>
              <span className="hidden text-xs font-semibold text-foreground sm:inline-block">
                {firstName}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      {/* ─── Signature KHPosCommerce Profile Dropdown Popover ─── */}
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 p-3.5 rounded-2xl bg-white dark:bg-[#0c1427] border border-slate-200/90 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-slate-100 font-sans z-50 select-none animate-in fade-in-80 zoom-in-95"
      >
        {/* 1. User Header Block (Avatar, Name, Email & Badges) */}
        <div className="flex items-start gap-3">
          <div className="relative size-12 shrink-0 rounded-full overflow-hidden border border-slate-200/90 dark:border-slate-700 bg-amber-500 shadow-xs ring-2 ring-emerald-500/20 dark:ring-emerald-500/30">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="h-full w-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-amber-500 to-orange-600">
                {getInitials()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight tracking-tight">
              {userName}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
              {userEmail}
            </p>

            {/* Badges: Role Pill + Online Status Pill */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60 leading-none">
                {roleTitle}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/60 leading-none">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t('userMenu.online', 'អនឡាញ')}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Organization & Location Selector Pill Banner (Signature KHPosCommerce element) */}
        <div className="mt-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1 text-[11px] text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5 truncate">
            <Building2 className="size-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-medium">មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិន...</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 text-slate-500 dark:text-slate-400 text-[10px]">
            <MapPin className="size-3 text-slate-400 shrink-0" />
            <span className="truncate">ត្បូងឃ្មុំ (HQ)</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 dark:bg-slate-800 my-2.5" />

        {/* 3. Action Menu Items List */}
        <div className="space-y-0.5">
          {/* Row 1: ព័ត៌មានផ្ទាល់ខ្លួន (Personal Profile) */}
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors text-xs text-slate-700 dark:text-slate-200 font-medium group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <User className="size-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              <span>{t('userMenu.personalProfile', 'ព័ត៌មានផ្ទាល់ខ្លួន')}</span>
            </div>
            <ChevronRight className="size-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
          </button>

          {/* Row 2: ភាសាប្រព័ន្ធ (System Language Interactive Toggle) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setLocale(locale === 'km' ? 'en' : 'km');
            }}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors text-xs text-slate-700 dark:text-slate-200 font-medium group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Globe className="size-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              <span>{t('userMenu.systemLanguage', 'ភាសាប្រព័ន្ធ')}</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md text-[10.5px] font-semibold text-slate-600 dark:text-slate-300 group-hover:bg-slate-200/80 dark:group-hover:bg-slate-700 transition-colors">
              <span>{locale === 'km' ? '🇰🇭 ភាសាខ្មែរ' : '🇬🇧 English'}</span>
              <ChevronRight className="size-3 text-slate-400" />
            </div>
          </button>

          {/* Row 3: រូបរាង & ពន្លឺប្រព័ន្ធ (Theme & Brightness Interactive Toggle) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggleTheme();
            }}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors text-xs text-slate-700 dark:text-slate-200 font-medium group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              {theme === 'dark' ? (
                <Moon className="size-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
              ) : (
                <Sun className="size-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
              )}
              <span>{t('userMenu.themeBrightness', 'រូបរាង & ពន្លឺប្រព័ន្ធ')}</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md text-[10.5px] font-semibold text-slate-600 dark:text-slate-300 group-hover:bg-slate-200/80 dark:group-hover:bg-slate-700 transition-colors">
              <span>{theme === 'dark' ? t('userMenu.darkMode', 'ទម្រង់ងងឹត') : t('userMenu.lightMode', 'ទម្រង់ពន្លឺ')}</span>
              <ChevronRight className="size-3 text-slate-400" />
            </div>
          </button>

          {/* Row 4: ការកំណត់ប្រព័ន្ធ (System Settings) */}
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors text-xs text-slate-700 dark:text-slate-200 font-medium group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Settings className="size-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              <span>{t('userMenu.systemSettings', 'ការកំណត់ប្រព័ន្ធ')}</span>
            </div>
            <ChevronRight className="size-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
          </button>

          {/* Row 5: កំណត់ត្រាសកម្មភាព (Activity Logs) */}
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors text-xs text-slate-700 dark:text-slate-200 font-medium group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <ClipboardList className="size-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              <span>{t('userMenu.activityLog', 'កំណត់ត្រាសកម្មភាព')}</span>
            </div>
            <ChevronRight className="size-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

        {/* 4. Footer: ចាកចេញពីគណនី (Sign Out) */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-xs font-semibold group cursor-pointer"
        >
          <LogOut className="size-4 text-rose-500 group-hover:scale-110 transition-transform" />
          <span>{t('userMenu.signOut', 'ចាកចេញពីគណនី')}</span>
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
