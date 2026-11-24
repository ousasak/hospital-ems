import React from 'react';
import { useTranslation } from '@/i18n';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Employee } from '../types';
import { EmployeeStatusBadge } from './EmployeeStatusBadge';
import { getAbsoluteImageUrl } from '@/utils/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const nameAvatarMap: Record<string, string> = {
  'Olivia Bennett': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
  'Daniel Carter': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
  'Sophia Mitchell': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  'Matteo Rossi': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
  'Hannah Müller': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces',
  'Elena Garcia': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces',
  'Liam Wilson': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
  'Chloe Laurent': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces',
  'Kenji Tanaka': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=faces',
  'Aisha Rahman': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces',
  'Lucas Martin': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=faces',
  'Emma Johansson': 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=faces',
};

interface EmployeeGridProps {
  employees: Employee[];
  isLoading: boolean;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

export const EmployeeGrid: React.FC<EmployeeGridProps> = ({
  employees,
  isLoading,
  onView,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse p-5 space-y-4 border-border/80 bg-card">
            <div className="flex justify-between items-center">
              <div className="h-5 w-16 bg-muted rounded-full" />
              <div className="h-6 w-6 bg-muted rounded-md" />
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="h-16 w-16 rounded-full bg-muted" />
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted/60 rounded" />
            </div>
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="h-3 w-full bg-muted/60 rounded" />
              <div className="h-3 w-3/4 bg-muted/60 rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <Card className="p-12 text-center border-border/80 bg-card">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Building2 className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-foreground">
          {t('employees.noEmployeesFound')}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('employees.noEmployeesFoundDesc')}
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {employees.map((emp) => {
        const fullName = `${emp.first_name} ${emp.last_name}`;
        const initials = `${emp.first_name?.[0] || ''}${emp.last_name?.[0] || ''}`.toUpperCase();
        const primaryAssignment = emp.primary_assignment;
        const departmentName = primaryAssignment?.department?.name || 'Operations';
        const positionTitle = primaryAssignment?.position?.title || 'Specialist';
        const officeLocation = primaryAssignment?.work_location?.name || t('employees.hospitalDefaultName');
        const avatarSrc = emp.avatar_url ? getAbsoluteImageUrl(emp.avatar_url) : (nameAvatarMap[fullName] || null);

        return (
          <Card
            key={emp.id}
            className="group relative border-border/80 bg-card shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
          >
            <CardContent className="p-5">
              {/* Top row: Status & Actions dropdown */}
              <div className="flex items-center justify-between mb-4">
                <EmployeeStatusBadge status={emp.employment_status || 'active'} />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => onView(emp)} className="gap-2 text-xs cursor-pointer">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{t('employees.viewProfile')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(emp)} className="gap-2 text-xs cursor-pointer">
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{t('employees.editEmployee')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(emp)}
                      className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{t('common.delete')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Avatar & Info */}
              <div
                className="flex flex-col items-center text-center cursor-pointer"
                onClick={() => onView(emp)}
              >
                <Avatar className="h-16 w-16 ring-2 ring-border shadow-xs group-hover:scale-105 transition-transform duration-200">
                  {avatarSrc && <AvatarImage src={avatarSrc} alt={fullName} className="object-cover" />}
                  <AvatarFallback className="text-base font-semibold bg-muted text-muted-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <h4 className="mt-3 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {fullName}
                </h4>

                <p className="text-xs text-muted-foreground">
                  {positionTitle}
                </p>

                <Badge variant="outline" className="mt-2 font-normal text-[11px] bg-muted/40">
                  {departmentName}
                </Badge>
              </div>

              {/* Meta details */}
              <div className="mt-4 pt-4 border-t border-border/60 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                  <span className="truncate">{officeLocation}</span>
                </div>

                <div className="flex items-center gap-2 truncate">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                  <span className="truncate">{emp.email || '—'}</span>
                </div>

                {emp.phone && (
                  <div className="flex items-center gap-2 truncate">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                    <span className="truncate">{emp.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="px-5 py-3 border-t border-border/60 bg-muted/20 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={() => onView(emp)}
              >
                {t('employees.viewProfile')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 px-2.5 text-muted-foreground hover:text-foreground"
                onClick={() => onEdit(emp)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};
