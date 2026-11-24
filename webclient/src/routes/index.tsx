import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuthStore } from '@/stores/authStore';

// ============================================================================
// 1. Route Guards & Fallback Components (Self-contained)
// ============================================================================

export const PageFallback: React.FC = () => (
  <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 p-8">
    <Loader2 className="size-8 animate-spin text-blue-600 dark:text-blue-400" />
    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
      កំពុងផ្ទុកទិន្នន័យ...
    </span>
  </div>
);

export const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !user?.roles?.includes(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageFallback />}>
    <Component />
  </Suspense>
);

// ============================================================================
// 2. Lazy Loaded Page Components
// ============================================================================

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const DashboardPage = lazy(() =>
  import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const DepartmentsPage = lazy(() =>
  import('@/pages/organization/DepartmentsPage').then((m) => ({ default: m.DepartmentsPage }))
);
const PositionsPage = lazy(() =>
  import('@/pages/organization/PositionsPage').then((m) => ({ default: m.PositionsPage }))
);
const WorkLocationsPage = lazy(() =>
  import('@/pages/organization/WorkLocationsPage').then((m) => ({ default: m.WorkLocationsPage }))
);
const OrgChartPage = lazy(() =>
  import('@/pages/organization/OrgChartPage').then((m) => ({ default: m.OrgChartPage }))
);
const EmployeeDirectoryPage = lazy(() =>
  import('@/pages/employees/EmployeeDirectoryPage').then((m) => ({ default: m.EmployeeDirectoryPage }))
);
const EmployeeFormPage = lazy(() =>
  import('@/pages/employees/EmployeeFormPage').then((m) => ({ default: m.EmployeeFormPage }))
);
const EmployeeDetailPage = lazy(() =>
  import('@/pages/employees/EmployeeDetailPage').then((m) => ({ default: m.EmployeeDetailPage }))
);
const AssignmentsPage = lazy(() =>
  import('@/pages/assignments/AssignmentsPage').then((m) => ({ default: m.AssignmentsPage }))
);
const AttendancePage = lazy(() =>
  import('@/pages/attendance/AttendancePage').then((m) => ({ default: m.AttendancePage }))
);
const ShiftsPage = lazy(() =>
  import('@/pages/shifts/ShiftsPage').then((m) => ({ default: m.ShiftsPage }))
);
const MobileQrAttendancePage = lazy(() =>
  import('@/pages/attendance/MobileQrAttendancePage').then((m) => ({
    default: m.MobileQrAttendancePage,
  }))
);
const LeavePage = lazy(() =>
  import('@/pages/leave/LeavePage').then((m) => ({ default: m.LeavePage }))
);
const PayrollPage = lazy(() =>
  import('@/pages/payroll/PayrollPage').then((m) => ({ default: m.PayrollPage }))
);
const DocumentsPage = lazy(() =>
  import('@/pages/employees/DocumentsPage').then((m) => ({ default: m.DocumentsPage }))
);
const RecruitmentPage = lazy(() =>
  import('@/pages/recruitment/RecruitmentPage').then((m) => ({ default: m.RecruitmentPage }))
);
const PerformancePage = lazy(() =>
  import('@/pages/performance/PerformancePage').then((m) => ({ default: m.PerformancePage }))
);
const ReportsPage = lazy(() =>
  import('@/pages/reports/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);
const UsersPage = lazy(() =>
  import('@/pages/users/UsersPage').then((m) => ({ default: m.UsersPage }))
);
const SettingsPage = lazy(() =>
  import('@/pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const ProfilePage = lazy(() =>
  import('@/pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const EmployeePortalPage = lazy(() =>
  import('@/pages/employee-portal/EmployeePortalPage').then((m) => ({
    default: m.EmployeePortalPage,
  }))
);

const ELEVATED_ROLES = [
  'Super Admin',
  'HR Manager',
  'HR Staff',
  'Department Manager',
  'Accountant',
];

const isEmployeeOnlyRole = (roles?: string[]): boolean => {
  if (!Array.isArray(roles) || roles.length === 0) return false;
  return roles.includes('Employee') && !roles.some((r) => ELEVATED_ROLES.includes(r));
};

export const RoleAwareShell: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  if (isEmployeeOnlyRole(user?.roles)) {
    if (location.pathname !== '/' && location.pathname !== '/my-portal') {
      return <Navigate to="/" replace />;
    }
    return withSuspense(EmployeePortalPage);
  }

  return <AdminLayout />;
};

// ============================================================================
// 3. Central Application Router Table
// ============================================================================

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <PublicRoute>{withSuspense(LoginPage)}</PublicRoute>,
  },
  {
    path: '/attendance/qr/:token',
    element: <ProtectedRoute>{withSuspense(MobileQrAttendancePage)}</ProtectedRoute>,
  },
  {
    path: '/my-portal',
    element: <ProtectedRoute>{withSuspense(EmployeePortalPage)}</ProtectedRoute>,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <RoleAwareShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: withSuspense(DashboardPage),
      },
      {
        path: 'index',
        element: withSuspense(DashboardPage),
      },

      // Organization
      {
        path: 'organization/departments',
        element: withSuspense(DepartmentsPage),
      },
      {
        path: 'organization/positions',
        element: withSuspense(PositionsPage),
      },
      {
        path: 'organization/locations',
        element: withSuspense(WorkLocationsPage),
      },
      {
        path: 'organization/chart',
        element: withSuspense(OrgChartPage),
      },

      // Workforce & HR
      {
        path: 'hr-dashboard',
        element: withSuspense(ReportsPage),
      },
      {
        path: 'employees',
        element: withSuspense(EmployeeDirectoryPage),
      },
      {
        path: 'employees/create',
        element: withSuspense(EmployeeFormPage),
      },
      {
        path: 'employees/:id/edit',
        element: withSuspense(EmployeeFormPage),
      },
      {
        path: 'employees/:id',
        element: withSuspense(EmployeeDetailPage),
      },
      {
        path: 'assignments',
        element: withSuspense(AssignmentsPage),
      },
      {
        path: 'attendance',
        element: withSuspense(AttendancePage),
      },
      {
        path: 'attendance/shifts',
        element: withSuspense(ShiftsPage),
      },
      {
        path: 'shifts',
        element: withSuspense(ShiftsPage),
      },
      {
        path: 'leaves',
        element: withSuspense(LeavePage),
      },
      {
        path: 'leave',
        element: withSuspense(LeavePage),
      },
      {
        path: 'leaves/balances',
        element: withSuspense(LeavePage),
      },
      {
        path: 'payroll',
        element: withSuspense(PayrollPage),
      },
      {
        path: 'performance',
        element: withSuspense(PerformancePage),
      },
      {
        path: 'documents',
        element: withSuspense(DocumentsPage),
      },

      // Recruitment
      {
        path: 'recruitment',
        element: withSuspense(RecruitmentPage),
      },
      {
        path: 'recruitment/candidates',
        element: withSuspense(RecruitmentPage),
      },
      {
        path: 'recruitment/interviews',
        element: withSuspense(RecruitmentPage),
      },
      {
        path: 'recruitment/onboarding',
        element: withSuspense(RecruitmentPage),
      },

      // Reports & Analytics
      {
        path: 'reports',
        element: withSuspense(ReportsPage),
      },
      {
        path: 'hr-reports',
        element: withSuspense(ReportsPage),
      },
      {
        path: 'payroll-reports',
        element: withSuspense(ReportsPage),
      },

      // Administration & Settings
      {
        path: 'profile',
        element: withSuspense(ProfilePage),
      },
      {
        path: 'users',
        element: withSuspense(UsersPage),
      },
      {
        path: 'settings',
        element: withSuspense(SettingsPage),
      },
      {
        path: 'settings/workflow',
        element: withSuspense(SettingsPage),
      },
      {
        path: 'settings/notifications',
        element: withSuspense(SettingsPage),
      },
      {
        path: 'settings/localization',
        element: withSuspense(SettingsPage),
      },

      // Catch-all Redirect
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export default router;
