import { Permission, PermissionModuleGroup } from '../types';

export interface ModuleDefinition {
  key: string;
  titleKey: string;
  defaultTitle: string;
  keywords: string[];
}

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    key: 'dashboard',
    titleKey: 'users.permissions.modules.dashboard',
    defaultTitle: 'Dashboard',
    keywords: ['dashboard'],
  },
  {
    key: 'users',
    titleKey: 'users.permissions.modules.users',
    defaultTitle: 'Users & Permissions',
    keywords: ['user', 'users', 'role', 'roles', 'audit'],
  },
  {
    key: 'organization',
    titleKey: 'users.permissions.modules.organization',
    defaultTitle: 'Organization & Structure',
    keywords: ['organization', 'assignment', 'assignments', 'department', 'departments', 'position', 'positions'],
  },
  {
    key: 'employees',
    titleKey: 'users.permissions.modules.employees',
    defaultTitle: 'Employees',
    keywords: ['employee', 'employees'],
  },
  {
    key: 'attendance',
    titleKey: 'users.permissions.modules.attendance',
    defaultTitle: 'Attendance & Shifts',
    keywords: ['attendance', 'shift', 'shifts', 'overtime'],
  },
  {
    key: 'leaves',
    titleKey: 'users.permissions.modules.leaves',
    defaultTitle: 'Leaves & Holidays',
    keywords: ['leave', 'leaves', 'holiday', 'holidays'],
  },
  {
    key: 'payroll',
    titleKey: 'users.permissions.modules.payroll',
    defaultTitle: 'Payroll & Compensation',
    keywords: ['payroll', 'salary', 'payslip'],
  },
  {
    key: 'recruitment',
    titleKey: 'users.permissions.modules.recruitment',
    defaultTitle: 'Recruitment',
    keywords: ['recruitment', 'candidate', 'vacancy', 'job'],
  },
  {
    key: 'performance',
    titleKey: 'users.permissions.modules.performance',
    defaultTitle: 'Performance & Appraisals',
    keywords: ['performance', 'appraisal'],
  },
  {
    key: 'training',
    titleKey: 'users.permissions.modules.training',
    defaultTitle: 'Training & Development',
    keywords: ['training'],
  },
  {
    key: 'reports',
    titleKey: 'users.permissions.modules.reports',
    defaultTitle: 'Reports & Analytics',
    keywords: ['report', 'reports', 'export'],
  },
  {
    key: 'settings',
    titleKey: 'users.permissions.modules.settings',
    defaultTitle: 'System Settings',
    keywords: ['setting', 'settings', 'system'],
  },
];

export function detectActionType(name: string): 'view' | 'create' | 'edit' | 'delete' | 'export' | 'other' {
  const lower = name.toLowerCase();
  if (lower.startsWith('view') || lower.startsWith('read') || lower.startsWith('show')) return 'view';
  if (lower.startsWith('create') || lower.startsWith('add') || lower.startsWith('store') || lower.startsWith('request')) return 'create';
  if (lower.startsWith('edit') || lower.startsWith('update') || lower.startsWith('manage') || lower.startsWith('process') || lower.startsWith('approve')) return 'edit';
  if (lower.startsWith('delete') || lower.startsWith('destroy') || lower.startsWith('remove')) return 'delete';
  if (lower.startsWith('export') || lower.startsWith('download')) return 'export';
  return 'other';
}

export function groupPermissionsByModule(permissions: Permission[]): PermissionModuleGroup[] {
  const groups: Record<string, PermissionModuleGroup> = {};

  // Initialize known module groups
  MODULE_DEFINITIONS.forEach((mod) => {
    groups[mod.key] = {
      key: mod.key,
      titleKey: mod.titleKey,
      defaultTitle: mod.defaultTitle,
      permissions: [],
    };
  });

  // Track additional permissions
  const otherGroup: PermissionModuleGroup = {
    key: 'other',
    titleKey: 'users.permissions.modules.other',
    defaultTitle: 'Additional Operations',
    permissions: [],
  };

  permissions.forEach((perm) => {
    const lower = perm.name.toLowerCase();
    let matchedKey: string | null = null;

    for (const mod of MODULE_DEFINITIONS) {
      if (mod.keywords.some((kw) => lower.includes(kw))) {
        matchedKey = mod.key;
        break;
      }
    }

    const actionType = detectActionType(perm.name);
    const item = {
      id: perm.id,
      name: perm.name,
      actionType,
      label: perm.name,
    };

    if (matchedKey && groups[matchedKey]) {
      groups[matchedKey].permissions.push(item);
    } else {
      otherGroup.permissions.push(item);
    }
  });

  const result: PermissionModuleGroup[] = Object.values(groups).filter(
    (g) => g.permissions.length > 0
  );

  if (otherGroup.permissions.length > 0) {
    result.push(otherGroup);
  }

  return result;
}
