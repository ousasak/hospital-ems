import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CloseButton } from '@/components/common';
import { useTranslation } from '@/i18n';
import { qrAttendanceService } from '@/services/qrAttendanceService';
import {
  QrCode,
  Download,
  Printer,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { EmployeeIdCardModal } from './EmployeeIdCardModal';

interface EmployeeQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number | string | null;
}

export const EmployeeQrModal: React.FC<EmployeeQrModalProps> = ({
  isOpen,
  onClose,
  employeeId,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isIdCardOpen, setIsIdCardOpen] = useState(false);

  const { data: qrData, isLoading, refetch } = useQuery({
    queryKey: ['employee-qr-details', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      return await qrAttendanceService.getEmployeeQr(employeeId);
    },
    enabled: isOpen && !!employeeId,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!employeeId) return;
      return await qrAttendanceService.generateEmployeeQr(employeeId);
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || t('employees.qrGenerated'));
      if (data?.active_qr) {
        queryClient.setQueryData(['employee-qr-details', employeeId], (old: any) => ({
          ...(old || {}),
          employee: data?.employee || old?.employee,
          active_qr: data.active_qr,
        }));
      }
      queryClient.invalidateQueries({ queryKey: ['employee-qr-details', employeeId] });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['employees-list'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to generate QR Code');
    },
  });

  const handleDownloadPng = () => {
    if (!activeQr?.png_data_uri) {
      toast.error(t('common.error'));
      return;
    }
    const a = document.createElement('a');
    a.href = activeQr.png_data_uri;
    a.download = `QR-${emp?.employee_code || 'CODE'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(t('employees.qrDownloaded'));
  };

  const emp = qrData?.employee || (qrData as any)?.data?.employee || ((qrData as any)?.id ? qrData : null);
  const activeQr = qrData?.active_qr || (qrData as any)?.data?.active_qr;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-card border border-border shadow-2xl rounded-2xl [&>button:last-child]:hidden">
          {/* Header */}
          <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white p-0.5 shadow-xs border border-border flex items-center justify-center shrink-0">
                  <img
                    src="/hospital-logo.png"
                    alt="Hospital Logo"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    {t('employees.personalQrTitle')}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground">
                    {emp?.full_name ? `${emp.full_name} (${emp.employee_code})` : emp?.employee_code || 'Employee'} • {emp?.department || 'Staff'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeQr && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{t('status.active')}</span>
                  </div>
                )}
                <CloseButton onClose={onClose} size="md" variant="default" />
              </div>
            </div>
          </DialogHeader>

          {/* Body */}
          <div className="p-5">
            {isLoading ? (
              <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
                <div className="h-6 w-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <span>{t('common.loading')}</span>
              </div>
            ) : !activeQr ? (
              /* No Active QR State */
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center">
                  <AlertTriangle size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-foreground">
                    {t('employees.noActiveQr')}
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    {t(
                      'employees.noActiveQrDesc',
                      t('employees.generateQrDesc')
                    )}
                  </p>
                </div>
                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl gap-2 text-xs"
                >
                  <QrCode size={14} />
                  <span>{t('employees.generateQr')}</span>
                </Button>
              </div>
            ) : (
              /* Clean Active QR Display */
              <div className="flex flex-col items-center space-y-4">
                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 w-full">
                  <div className="w-52 h-52 bg-white p-3 rounded-2xl shadow-md border border-slate-200 flex items-center justify-center overflow-hidden">
                    {activeQr?.svg ? (
                      <div
                        className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                        dangerouslySetInnerHTML={{ __html: activeQr.svg }}
                      />
                    ) : activeQr?.png_data_uri ? (
                      <img
                        src={activeQr.png_data_uri}
                        alt="QR Code"
                        className="w-full h-full object-contain"
                      />
                    ) : null}
                  </div>

                  <div className="mt-3 text-center space-y-0.5">
                    <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                      {emp?.employee_code}
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      {t('employees.qrCreatedOn')}: {new Date(activeQr.generated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Primary Action Buttons: Print Card & Download PNG */}
                <div className="grid grid-cols-2 gap-2.5 w-full">
                  <Button
                    size="sm"
                    onClick={() => setIsIdCardOpen(true)}
                    className="h-9 text-xs rounded-xl gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-xs"
                  >
                    <Printer size={14} />
                    <span>{t('employees.printCard')}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPng}
                    className="h-9 text-xs rounded-xl gap-2 font-medium"
                  >
                    <Download size={14} />
                    <span>{t('employees.downloadPng')}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="p-3 px-5 border-t border-border bg-muted/20">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-5 rounded-xl border border-border/80 dark:border-slate-700 bg-card dark:bg-slate-800/80 text-xs font-bold text-muted-foreground dark:text-slate-300 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-slate-700 transition-colors cursor-pointer active:scale-95 shadow-2xs ml-auto"
            >
              {t('common.close')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ID Card Modal */}
      {isIdCardOpen && employeeId && (
        <EmployeeIdCardModal
          isOpen={isIdCardOpen}
          onClose={() => setIsIdCardOpen(false)}
          employeeId={employeeId}
        />
      )}
    </>
  );
};

export default EmployeeQrModal;
