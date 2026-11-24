import React, { useState } from 'react';
import { UserPlus, Check, Loader2 } from 'lucide-react';
import { EmployeeFormData } from '../types';
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
import { cn } from '@/utils';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  isLoading: boolean;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    department: 'Human Resources',
    employmentType: 'Full-time',
    country: 'Cambodia',
    city: 'Tbong Khmum',
    office: 'Cambodia-China Friendship Hospital',
    manager: 'Dr. Meng Sokha',
    email: '',
    phone: '',
    title: 'Medical Staff',
    medical_license_number: '',
    specialization: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
    await onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/70 bg-muted/20">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-base sm:text-lg">Add Employee</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Add a new team member to Northstar Global Services
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Form */}
        <form id="add-employee-form" onSubmit={handleSubmit} className="space-y-4 px-6 py-4" noValidate>
          {/* Full Name */}
          <div>
            <label htmlFor="new-emp-name" className="mb-1.5 block text-xs font-medium text-foreground">
              Full Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="new-emp-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Isabella Rossi"
              className={cn('h-9 text-xs', errors.name && 'border-destructive focus-visible:ring-destructive')}
            />
            {errors.name && (
              <p className="mt-1 text-[11px] font-medium text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          {/* Department & Employment Type */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label htmlFor="new-emp-department" className="mb-1.5 block text-xs font-medium text-foreground">
                Department <span className="text-destructive">*</span>
              </label>
              <select
                id="new-emp-department"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="Human Resources">Human Resources</option>
                <option value="Operations">Operations</option>
                <option value="Finance">Finance</option>
                <option value="Engineering">Engineering</option>
                <option value="Sales">Sales</option>
                <option value="Customer Support">Customer Support</option>
                <option value="Field Services">Field Services</option>
                <option value="Administration">Administration</option>
                <option value="Marketing">Marketing</option>
                <option value="IT">IT</option>
              </select>
            </div>

            <div>
              <label htmlFor="new-emp-type" className="mb-1.5 block text-xs font-medium text-foreground">
                Employment Type
              </label>
              <select
                id="new-emp-type"
                value={formData.employmentType}
                onChange={(e) => handleChange('employmentType', e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
                <option value="Part-time">Part-time</option>
                <option value="Intern">Intern</option>
              </select>
            </div>
          </div>

          {/* Country & City */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label htmlFor="new-emp-country" className="mb-1.5 block text-xs font-medium text-foreground">
                Country <span className="text-destructive">*</span>
              </label>
              <Input
                id="new-emp-country"
                type="text"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="e.g. Cambodia"
                className={cn('h-9 text-xs', errors.country && 'border-destructive focus-visible:ring-destructive')}
              />
              {errors.country && (
                <p className="mt-1 text-[11px] font-medium text-destructive">
                  {errors.country}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="new-emp-city" className="mb-1.5 block text-xs font-medium text-foreground">
                City
              </label>
              <Input
                id="new-emp-city"
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="e.g. Phnom Penh"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Office & Manager */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label htmlFor="new-emp-office" className="mb-1.5 block text-xs font-medium text-foreground">
                Office
              </label>
              <Input
                id="new-emp-office"
                type="text"
                value={formData.office}
                onChange={(e) => handleChange('office', e.target.value)}
                placeholder="e.g. Phnom Penh Headquarters"
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label htmlFor="new-emp-manager" className="mb-1.5 block text-xs font-medium text-foreground">
                Manager
              </label>
              <Input
                id="new-emp-manager"
                type="text"
                value={formData.manager}
                onChange={(e) => handleChange('manager', e.target.value)}
                placeholder="e.g. Olivia Bennett"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Email Address & Phone Number */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label htmlFor="new-emp-email" className="mb-1.5 block text-xs font-medium text-foreground">
                Email Address <span className="text-destructive">*</span>
              </label>
              <Input
                id="new-emp-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="e.g. isabella@northstarglobal.com"
                className={cn('h-9 text-xs', errors.email && 'border-destructive focus-visible:ring-destructive')}
              />
              {errors.email && (
                <p className="mt-1 text-[11px] font-medium text-destructive">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="new-emp-phone" className="mb-1.5 block text-xs font-medium text-foreground">
                Phone Number
              </label>
              <Input
                id="new-emp-phone"
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="e.g. +855 12 345 678"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Job Title & Base Salary */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label htmlFor="new-emp-title" className="mb-1.5 block text-xs font-medium text-foreground">
                Job Title
              </label>
              <Input
                id="new-emp-title"
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g. Senior Specialist"
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label htmlFor="new-emp-license" className="mb-1.5 block text-xs font-medium text-foreground">
                Medical License No.
              </label>
              <Input
                id="new-emp-license"
                type="text"
                value={formData.medical_license_number || ''}
                onChange={(e) => handleChange('medical_license_number', e.target.value)}
                placeholder="e.g. DOC-2024-001"
                className="h-9 text-xs font-mono uppercase"
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
            form="add-employee-form"
            disabled={isLoading}
            size="sm"
            className="gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span>Add Employee</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
