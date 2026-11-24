import React, { useState, useEffect } from 'react';
import { UserCheck, Check, Loader2 } from 'lucide-react';
import { Employee, EmployeeFormData } from '../types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils';

interface EditEmployeeModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSubmit: (id: number, data: EmployeeFormData) => Promise<void>;
  isLoading: boolean;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  isOpen,
  employee,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    title: '',
    department: '',
    employmentType: 'Full-time',
    status: 'active',
    email: '',
    phone: '',
    country: '',
    city: '',
    office: '',
    manager: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (employee) {
      setFormData({
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        first_name: employee.first_name,
        last_name: employee.last_name,
        title:
          employee.primary_assignment?.position?.title ||
          'Specialist',
        department:
          employee.primary_assignment?.department?.name ||
          'Operations',
        employmentType:
          employee.primary_assignment?.employment_type?.name || 'Full-time',
        status: employee.employment_status || 'active',
        email: employee.email || '',
        phone: employee.phone || '',
        country:
          employee.primary_assignment?.work_location?.country ||
          employee.nationality ||
          'Cambodia',
        city: employee.city || employee.primary_assignment?.work_location?.city || 'Phnom Penh',
        office: employee.primary_assignment?.work_location?.name || 'Cambodia-China Friendship Hospital',
        medical_license_number: employee.medical_license_number || '',
        specialization: employee.specialization || '',
        manager: employee.primary_assignment?.supervisor
          ? `${employee.primary_assignment.supervisor.first_name} ${employee.primary_assignment.supervisor.last_name}`
          : 'Olivia Bennett',
      });
      setErrors({});
    }
  }, [employee]);

  if (!employee) return null;

  const handleChange = (field: keyof EmployeeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Full Name is required.';
    if (!formData.title?.trim()) newErrors.title = 'Job Title is required.';
    if (!formData.department) newErrors.department = 'Department is required.';
    if (!formData.country?.trim()) newErrors.country = 'Country is required.';
    if (!formData.email?.trim()) {
      newErrors.email = 'Email Address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(employee.id, formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[580px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/70 bg-muted/20">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserCheck className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base sm:text-lg">Edit Employee</DialogTitle>
                <Badge variant="outline" className="font-mono text-xs">
                  {employee.employee_code}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Update employee details and organization profile
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Form */}
        <form id="edit-employee-form" onSubmit={handleSubmit} className="space-y-4 px-6 py-4" noValidate>
          {/* Full Name & Job Title */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-emp-name" className="mb-1.5 block text-xs font-medium text-foreground">
                Full Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="edit-emp-name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={cn('h-9 text-xs', errors.name && 'border-destructive focus-visible:ring-destructive')}
              />
              {errors.name && (
                <p className="mt-1 text-[11px] font-medium text-destructive">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="edit-emp-title" className="mb-1.5 block text-xs font-medium text-foreground">
                Job Title <span className="text-destructive">*</span>
              </label>
              <Input
                id="edit-emp-title"
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className={cn('h-9 text-xs', errors.title && 'border-destructive focus-visible:ring-destructive')}
              />
              {errors.title && (
                <p className="mt-1 text-[11px] font-medium text-destructive">
                  {errors.title}
                </p>
              )}
            </div>
          </div>

          {/* Department, Employment Type & Status */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <div>
              <label htmlFor="edit-emp-department" className="mb-1.5 block text-xs font-medium text-foreground">
                Department <span className="text-destructive">*</span>
              </label>
              <select
                id="edit-emp-department"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="Executive Office">Executive Office</option>
                <option value="Engineering & Technology">Engineering & Technology</option>
                <option value="Human Resources & People">Human Resources & People</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance & Accounting">Finance & Accounting</option>
                <option value="Operations">Operations</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Customer Support">Customer Support</option>
                <option value="IT">IT</option>
              </select>
            </div>

            <div>
              <label htmlFor="edit-emp-type" className="mb-1.5 block text-xs font-medium text-foreground">
                Employment Type
              </label>
              <select
                id="edit-emp-type"
                value={formData.employmentType}
                onChange={(e) => handleChange('employmentType', e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="Full-time Permanent">Full-time Permanent</option>
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
                <option value="Part-time">Part-time</option>
                <option value="Intern">Intern</option>
              </select>
            </div>

            <div>
              <label htmlFor="edit-emp-status" className="mb-1.5 block text-xs font-medium text-foreground">
                Status
              </label>
              <select
                id="edit-emp-status"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="probation">Probation</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Email Address & Phone Number */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-emp-email" className="mb-1.5 block text-xs font-medium text-foreground">
                Email Address <span className="text-destructive">*</span>
              </label>
              <Input
                id="edit-emp-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={cn('h-9 text-xs', errors.email && 'border-destructive focus-visible:ring-destructive')}
              />
              {errors.email && (
                <p className="mt-1 text-[11px] font-medium text-destructive">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="edit-emp-phone" className="mb-1.5 block text-xs font-medium text-foreground">
                Phone Number
              </label>
              <Input
                id="edit-emp-phone"
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Country & City */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-emp-country" className="mb-1.5 block text-xs font-medium text-foreground">
                Country <span className="text-destructive">*</span>
              </label>
              <Input
                id="edit-emp-country"
                type="text"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className={cn('h-9 text-xs', errors.country && 'border-destructive focus-visible:ring-destructive')}
              />
              {errors.country && (
                <p className="mt-1 text-[11px] font-medium text-destructive">
                  {errors.country}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="edit-emp-city" className="mb-1.5 block text-xs font-medium text-foreground">
                City
              </label>
              <Input
                id="edit-emp-city"
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Office & Manager */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-emp-specialization" className="mb-1.5 block text-xs font-medium text-foreground">
                Medical Specialization
              </label>
              <Input
                id="edit-emp-specialization"
                type="text"
                value={formData.specialization || ''}
                onChange={(e) => handleChange('specialization', e.target.value)}
                placeholder="e.g. Emergency Medicine, Nursing"
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label htmlFor="edit-emp-manager" className="mb-1.5 block text-xs font-medium text-foreground">
                Reporting Manager
              </label>
              <Input
                id="edit-emp-manager"
                type="text"
                value={formData.manager}
                onChange={(e) => handleChange('manager', e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <DialogFooter className="px-6 py-4 border-t border-border/70 bg-muted/20 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="edit-employee-form"
            disabled={isLoading}
            size="sm"
            className="gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span>Save Changes</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
