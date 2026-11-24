import React, { useEffect, useState, useMemo } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  X,
  Building2,
  LayoutGrid,
  Users,
  BarChart3,
  CalendarCheck,
  CalendarDays,
  Clock,
  GitFork,
  Network,
  Award,
  Folder,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useLocaleStore } from '../../stores/localeStore';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import { EditProfileModal } from '../profile/EditProfileModal';
import { ChangePasswordModal } from '../profile/ChangePasswordModal';

export interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  // Backward compatibility with AppLayout
  isOpen?: boolean;
  onClose?: () => void;
}

// Official Hospital Logo Emblem (មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិន ត្បូងឃ្មុំ)
export const HospitalLogoEmblem: React.FC<{ className?: string }> = ({
  className = 'size-10',
}) => (
  <div
    className={`${className} rounded-full bg-white flex items-center justify-center shrink-0 shadow-md border border-slate-200/90 dark:border-slate-700 p-0.5 overflow-hidden ring-2 ring-emerald-500/20`}
  >
    <img
      src="/hospital-logo.png"
      alt="មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិន ត្បូងឃ្មុំ"
      className="w-full h-full object-contain rounded-full"
      loading="eager"
    />
  </div>
);

export const StaffStreamLogoEmblem = HospitalLogoEmblem;
export const ShopLogoEmblem = HospitalLogoEmblem;
export const SmartHREmblem = HospitalLogoEmblem;

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  badge?: string | number;
  show: boolean;
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed: propCollapsed,
  onToggle,
  mobileOpen: propMobileOpen,
  onMobileClose,
  isOpen,
  onClose,
}) => {
  const { user, hasRole, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useThemeStore();
  const { t, locale } = useLocaleStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Support both prop combinations (direct props or Zustand global theme store)
  const isCollapsed = propCollapsed !== undefined ? propCollapsed : sidebarCollapsed;
  const isMobileOpen = propMobileOpen !== undefined ? propMobileOpen : Boolean(isOpen);
  const handleToggle = onToggle || toggleSidebarCollapsed;
  const handleCloseMobile = onMobileClose || onClose;

  const isHR = hasRole(['Super Admin', 'HR Manager', 'HR Staff']);
  const isSuperAdmin = hasRole('Super Admin');

  // Live real-time clock for the "Network Stable" status bar
  const [currentTime, setCurrentTime] = useState(() => {
    const d = new Date();
    return d.toTimeString().split(' ')[0];
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(d.toTimeString().split(' ')[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut: Cmd+B / Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggle]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (handleCloseMobile) handleCloseMobile();
  };

  const handleNavClick = () => {
    if (handleCloseMobile) handleCloseMobile();
  };

  // Compute initials for user profile badge
  const userInitials = useMemo(() => {
    if (user?.employee?.first_name && user?.employee?.last_name) {
      return `${user.employee.first_name.trim()[0]}${user.employee.last_name.trim()[0]}`.toUpperCase();
    }
    if (user?.name) {
      const clean = user.name.replace(/^(វេជ្ជ\.|លោក\.|លោកស្រី\.|កញ្ញា\.|វេជ្ជបណ្ឌិត)\s*/i, '').trim();
      const parts = clean.split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return clean.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'SS';
  }, [user]);

  const userDisplayName = user?.name || user?.email || 'Admin User';
  const userRole = user?.roles?.[0] || 'Super Admin';
  const userIdentifier =
    user?.employee?.employee_code || (user?.email ? user.email.split('@')[0] : 'uhst.iit.sakousa');
  const userAvatar = user?.employee?.avatar_url || (user as any)?.avatar_url;

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  // StaffStream EMS 1:1 Navigation Structure
  const navGroups: NavGroup[] = [
    {
      id: 'main',
      title: t('nav.main'),
      items: [
        {
          label: t('nav.dashboard'),
          to: '/',
          icon: <LayoutGrid className="size-4" />,
          show: true,
        },
      ],
    },
    {
      id: 'workforce',
      title: t('nav.workforce'),
      items: [
        {
          label: t('nav.employees'),
          to: '/employees',
          icon: <Users className="size-4" />,
          show: true,
        },
        {
          label: t('nav.attendance'),
          to: '/attendance',
          icon: <CalendarCheck className="size-4" />,
          show: true,
        },
        {
          label: t('nav.leaveManagement'),
          to: '/leaves',
          icon: <CalendarDays className="size-4" />,
          show: true,
        },
        {
          label: t('nav.workShifts'),
          to: '/shifts',
          icon: <Clock className="size-4" />,
          show: true,
        },
        {
          label: t('nav.assignments'),
          to: '/assignments',
          icon: <GitFork className="size-4" />,
          show: isHR,
        },
        {
          label: t('nav.documents'),
          to: '/documents',
          icon: <Folder className="size-4" />,
          show: true,
        },
      ],
    },
    {
      id: 'organization',
      title: t('nav.organization'),
      items: [
        {
          label: t('nav.orgChart'),
          to: '/organization/chart',
          icon: <Network className="size-4" />,
          show: true,
        },
        {
          label: t('nav.departments'),
          to: '/organization/departments',
          icon: <Building2 className="size-4" />,
          show: true,
        },
        {
          label: t('nav.positions'),
          to: '/organization/positions',
          icon: <Award className="size-4" />,
          show: true,
        },
      ],
    },
    {
      id: 'system',
      title: t('nav.system'),
      items: [
        {
          label: t('nav.reports'),
          to: '/reports',
          icon: <BarChart3 className="size-4" />,
          show: true,
        },
        {
          label: t('nav.usersRoles'),
          to: '/users',
          icon: <ShieldCheck className="size-4" />,
          show: isSuperAdmin,
        },
        {
          label: t('nav.systemSettings'),
          to: '/settings',
          icon: <Settings className="size-4" />,
          show: isSuperAdmin,
        },
      ],
    },
  ];

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        data-slot="app-sidebar"
        className={`flex flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out select-none font-sans ${
          isCollapsed ? 'w-[70px] lg:w-[68px]' : 'w-64 lg:w-[260px]'
        } ${
          isMobileOpen
            ? 'translate-x-0 shadow-2xl'
            : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          backgroundColor: 'var(--sidebar-bg, #0a1e1d)',
          borderRight: '1px solid var(--sidebar-border-color, #123633)',
          color: 'var(--sidebar-fg, #8ea39f)',
        }}
      >
        {/* Brand Header: Logo, Name & Collapse/Expand Toggle */}
        <div
          className={`h-16 px-4 flex items-center border-b border-[#123633] dark:border-[#0e2725] relative shrink-0 ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div
            onClick={() => {
              navigate('/');
              handleNavClick();
            }}
            className={`flex items-center gap-3 cursor-pointer min-w-0 ${
              isCollapsed ? 'justify-center' : 'flex-1'
            }`}
          >
            <HospitalLogoEmblem className="size-10" />

            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[13px] text-white tracking-tight leading-tight truncate" title="មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិន ត្បូងឃ្មុំ">
                    ម.ព កម្ពុជា-ចិន ត្បូងឃ្មុំ
                  </span>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-1 py-0.2 rounded tracking-wider uppercase leading-none">
                    EMS
                  </span>
                </div>
                <span className="text-[10px] font-medium text-[#7fa9a3] tracking-wide leading-none mt-1 truncate">
                  ប្រព័ន្ធគ្រប់គ្រងបុគ្គលិក
                </span>
              </div>
            )}
          </div>

          {/* Close button for Mobile Drawer (visible on < lg) */}
          {isMobileOpen && (
            <button
              type="button"
              onClick={handleCloseMobile}
              className="lg:hidden size-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close Sidebar"
            >
              <X className="size-5 text-slate-300" />
            </button>
          )}

          {/* Circular Collapse/Expand Toggle Button (Visible on lg and larger) */}
          <button
            type="button"
            onClick={handleToggle}
            className="hidden lg:flex absolute -right-3 top-5 z-40 size-6 rounded-full bg-[#0a1e1d] border border-[#1b4b47] hover:border-emerald-400 text-[#8ea39f] hover:text-white hover:bg-[#102d2a] items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110 active:scale-95 focus:outline-none"
            title={isCollapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="size-3.5 text-emerald-400" />
            ) : (
              <ChevronLeft className="size-3.5 text-emerald-400" />
            )}
          </button>
        </div>

        {/* Live Network Status Bar */}
        <div
          className={`px-4 py-2 border-b border-[#123633]/80 dark:border-[#0e2725] flex items-center select-none text-[11px] font-mono shrink-0 bg-black/20 ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="relative flex h-2.5 w-2.5 cursor-pointer">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="bg-[#0e2625] text-white border-[#1b4b47]"
              >
                <p className="font-sans font-medium text-xs">{t('common.networkStable')}</p>
                <p className="font-mono text-[10px] text-emerald-400">{currentTime}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-sans text-[11px] font-medium tracking-tight text-slate-300">
                  {t('common.networkStable')}
                </span>
              </div>
              <span className="text-[#678b86] text-[11px] font-mono tabular-nums">
                {currentTime}
              </span>
            </>
          )}
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-3.5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => item.show);
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.id} className="space-y-1">
                {!isCollapsed ? (
                  <p className="px-3 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[#5a7d78] select-none">
                    {group.title}
                  </p>
                ) : (
                  <div className="h-px bg-[#123633] my-2 mx-2" />
                )}

                {visibleItems.map((item) => {
                  const badgeText = item.badge;
                  const isActive =
                    item.to === '/'
                      ? location.pathname === '/' || location.pathname === '/index'
                      : location.pathname === item.to ||
                        location.pathname.startsWith(`${item.to}/`);

                  const linkContent = (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      onClick={handleNavClick}
                      className={
                        `flex items-center rounded-xl text-[13px] font-medium transition-all select-none outline-none group relative ${
                          isCollapsed
                            ? 'justify-center size-10 mx-auto'
                            : 'gap-3 px-3 py-2'
                        } ${
                          isActive
                            ? 'bg-white/[0.08] text-white font-semibold shadow-2xs ' +
                              (isCollapsed ? '' : 'border-l-2 border-emerald-400')
                            : 'text-[#8ea39f] hover:text-white hover:bg-white/[0.05]'
                        }`
                      }
                    >
                      {/* Active Indicator: Emerald dot on the left edge when collapsed */}
                      {isCollapsed && isActive && (
                        <span className="absolute left-1 size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
                      )}

                      <span
                        className={`shrink-0 transition-colors relative flex items-center justify-center ${
                          isActive
                            ? 'text-emerald-400'
                            : 'text-[#8ea39f] group-hover:text-white'
                        }`}
                      >
                        {item.icon}

                        {/* Collapsed Badge Bubble */}
                        {isCollapsed && badgeText !== undefined && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[#0a1e1d]">
                            {badgeText}
                          </span>
                        )}
                      </span>

                      {!isCollapsed && (
                        <>
                          <span className="truncate flex-1 tracking-tight">
                            {item.label}
                          </span>

                          {/* Expanded Badge Pill */}
                          {badgeText !== undefined && (
                            <span className="ml-auto bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10.5px] font-semibold px-2 py-0.5 rounded-full leading-none shrink-0 font-mono">
                              {badgeText}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.to}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent
                          side="right"
                          sideOffset={12}
                          className="bg-[#0e2625] text-white border-[#1b4b47] shadow-xl text-xs py-1 px-2.5 rounded-md flex items-center gap-1.5"
                        >
                          <span>{item.label}</span>
                          {badgeText !== undefined && (
                            <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                              {badgeText}
                            </span>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return linkContent;
                })}
              </div>
            );
          })}
        </nav>

        {/* User Profile & Logout Footer */}
        <div className="p-3 border-t border-[#123633] dark:border-[#0e2725] bg-black/25 shrink-0">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={() => setEditProfileOpen(true)}
                  className="size-9 rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-bold text-xs flex items-center justify-center mx-auto cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all shadow-md shadow-emerald-950/40 overflow-hidden"
                >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userDisplayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    userInitials
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                sideOffset={12}
                className="bg-[#0e2625] text-white border-[#1b4b47] shadow-xl text-xs py-1.5 px-3 rounded-md"
              >
                <p className="font-semibold text-white">{userDisplayName}</p>
                <p className="text-[10px] text-emerald-400 uppercase font-medium">
                  {userRole}
                </p>
                <p className="text-[10px] text-slate-300 font-mono mt-0.5">
                  {userIdentifier}
                </p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="bg-[#0c2724]/90 border border-[#1b4e49] rounded-2xl p-2.5 shadow-sm space-y-2.5">
              {/* Profile Card Header: Avatar + Info */}
              <div className="flex items-center gap-2.5">
                <div className="relative size-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm border border-emerald-400/50 overflow-hidden">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userDisplayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    userInitials
                  )}
                  <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-400 ring-1 ring-black" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-white truncate leading-tight">
                    {userDisplayName}
                  </p>
                  <p className="text-[10.5px] text-[#7fa39f] font-mono truncate">
                    {userIdentifier}
                  </p>
                  <div className="mt-1">
                    <span className="inline-block bg-purple-500/20 text-purple-200 border border-purple-400/30 text-[9.5px] font-semibold px-2 py-0.2 rounded-full leading-relaxed">
                      {userRole === 'Super Admin'
                        ? 'Super Admin'
                        : userRole === 'Employee'
                        ? 'បុគ្គលិក'
                        : userRole}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row 1: Edit Profile & My Portal */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(true)}
                  className="w-full h-7 px-2 bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-300 text-white text-[11px] font-medium rounded-lg flex items-center justify-center gap-1 transition-all border border-white/10 hover:border-emerald-500/40 cursor-pointer"
                  title="កែព័ត៌មានផ្ទាល់ខ្លួន"
                >
                  <span className="text-xs">✏️</span>
                  <span className="truncate">កែព័ត៌មាន</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/my-portal');
                    handleNavClick();
                  }}
                  className="w-full h-7 px-2 bg-white/10 hover:bg-teal-500/20 hover:text-teal-300 text-white text-[11px] font-medium rounded-lg flex items-center justify-center gap-1 transition-all border border-white/10 hover:border-teal-500/40 cursor-pointer"
                  title="ទំព័ររបស់ខ្ញុំ"
                >
                  <span className="text-xs">👤</span>
                  <span className="truncate">ទំព័ររបស់ខ្ញុំ</span>
                </button>
              </div>

              {/* Action Buttons Row 2: Change Password & Logout */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(true)}
                  className="w-full h-7 px-2 bg-white/5 hover:bg-amber-500/20 hover:text-amber-200 text-white/90 text-[10.5px] font-medium rounded-lg flex items-center justify-center gap-1 transition-all border border-white/10 hover:border-amber-500/40 cursor-pointer"
                  title="ប្តូរពាក្យសម្ងាត់"
                >
                  <span className="text-xs">🔒</span>
                  <span className="truncate">ប្តូរពាក្យសម្ងាត់</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full h-7 px-2 bg-white/5 hover:bg-red-500/20 hover:text-red-200 text-white/90 text-[10.5px] font-medium rounded-lg flex items-center justify-center gap-1 transition-all border border-white/10 hover:border-red-500/40 cursor-pointer"
                  title="ចាកចេញពីប្រព័ន្ធ"
                >
                  <span className="text-xs">🚪</span>
                  <span className="truncate">ចាកចេញ</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Edit Profile & Change Password Modals */}
        <EditProfileModal
          open={editProfileOpen}
          onOpenChange={setEditProfileOpen}
        />
        <ChangePasswordModal
          open={changePasswordOpen}
          onOpenChange={setChangePasswordOpen}
        />
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;
