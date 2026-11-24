import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CloseButton } from '@/components/common';
import { useTranslation } from '@/i18n';
import { qrAttendanceService } from '@/services/qrAttendanceService';
import { getAbsoluteImageUrl } from '@/utils/image';
import { Printer, Download, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';

interface EmployeeIdCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number | string | null;
}

export const EmployeeIdCardModal: React.FC<EmployeeIdCardModalProps> = ({
  isOpen,
  onClose,
  employeeId,
}) => {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);

  const { data: idCard, isLoading } = useQuery({
    queryKey: ['employee-id-card', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      return await qrAttendanceService.getEmployeeIdCard(employeeId);
    },
    enabled: isOpen && !!employeeId,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPng = () => {
    if (!idCard?.qr?.png_data_uri) {
      toast.error(t('common.error'));
      return;
    }
    const a = document.createElement('a');
    a.href = idCard.qr.png_data_uri;
    a.download = `ID-CARD-QR-${idCard.employee.employee_code}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(t('employees.qrDownloaded'));
  };

  const emp = idCard?.employee;
  const org = idCard?.organization;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 [&>button:last-child]:hidden">
        {/* Inject precise print styles for CR80 card printing */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-id-card, #printable-id-card * {
              visibility: visible;
            }
            #printable-id-card {
              position: fixed;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              margin: 0 !important;
              box-shadow: none !important;
              border: 1px solid #cbd5e1 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* Modal Header */}
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
                <ShieldCheck size={18} />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                  {t('employees.idCardPrintTitle')}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {emp?.full_name} • {emp?.employee_code}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 no-print">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPng}
                className="h-8 gap-1.5 text-xs rounded-lg"
              >
                <Download size={13} />
                <span>{t('employees.downloadQr')}</span>
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                className="h-8 gap-1.5 text-xs rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium"
              >
                <Printer size={13} />
                <span>{t('common.print')}</span>
              </Button>
              <CloseButton onClose={onClose} size="md" variant="default" />
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
            <div className="h-6 w-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <span>{t('common.loading')}</span>
          </div>
        ) : !emp ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {t('common.noData')}
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center justify-center">
            {/* ─── Printable ID Card (CR80 Standard Dimensions: 85.6mm x 54mm) ─── */}
            <div
              ref={cardRef}
              id="printable-id-card"
              className="w-[340px] sm:w-[360px] rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200/90 overflow-hidden relative print:shadow-none print:border-none print:m-0 select-none"
              style={{ minHeight: '520px' }}
            >
              {/* Top Accent Line */}
              <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 w-full" />

              {/* Hospital Header Banner */}
              <div className="bg-gradient-to-br from-[#0c4a45] via-[#0f766e] to-[#115e59] text-white px-4 py-3.5 relative shadow-xs">
                <div className="flex items-center gap-3">
                  {/* Official Hospital Emblem Logo */}
                  <div className="h-12 w-12 rounded-full bg-white p-0.5 shadow-md border-2 border-white/90 flex items-center justify-center shrink-0">
                    <img
                      src={org?.logo_url || '/hospital-logo.png'}
                      alt={t('employees.hospitalDefaultName')}
                      className="w-full h-full object-contain rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/hospital-logo.png';
                      }}
                    />
                  </div>

                  {/* Hospital Titles */}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[13px] sm:text-[13.5px] font-black text-white leading-tight tracking-tight font-khmer">
                      {org?.name || t('employees.hospitalDefaultName')}
                    </h2>
                    <p className="text-[9px] sm:text-[9.5px] font-bold text-teal-100 tracking-wider uppercase leading-none font-sans mt-1">
                      {org?.legal_name || 'Cambodia-China Friendship Hospital'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Employee Photo & Identification */}
              <div className="p-5 pt-4 flex flex-col items-center text-center">
                {/* Avatar with Status Ring */}
                <div className="relative mb-2.5">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-slate-100 ring-2 ring-teal-600/20 flex items-center justify-center">
                    {emp.avatar_url && !emp.avatar_url.includes('unsplash') ? (
                      <img
                        src={getAbsoluteImageUrl(emp.avatar_url)}
                        alt={emp.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-teal-700 bg-gradient-to-b from-teal-50 to-teal-100/60 w-full h-full">
                        <User size={34} strokeWidth={2} />
                        <span className="text-[11px] font-black tracking-tight mt-0.5 font-mono">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <span
                    className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[11px] font-bold shadow-xs"
                    title="Verified Staff"
                  >
                    ✓
                  </span>
                </div>

                {/* Names */}
                <h3 className="text-base sm:text-[17px] font-black text-slate-900 tracking-tight leading-snug">
                  {emp.full_name}
                </h3>
                <div className="mt-1 flex items-center justify-center">
                  <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-0.5 rounded-full border border-teal-200/90 shadow-2xs">
                    {emp.position || 'Medical Staff'}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 mt-1">
                  {emp.department || 'Clinical Services'}
                </span>

                {/* Medical License if Clinical Staff */}
                {emp.medical_license_number && (
                  <div className="mt-1.5 text-[10px] font-mono text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200">
                    Lic: <span className="font-bold text-slate-800">{emp.medical_license_number}</span>
                    {emp.specialization && <span> • {emp.specialization}</span>}
                  </div>
                )}

                {/* QR Code Container */}
                <div className="my-3 p-3 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col items-center justify-center w-full max-w-[210px]">
                  <div className="p-1 bg-white rounded-xl">
                    {idCard?.qr?.svg ? (
                      <div
                        className="w-32 h-32 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                        dangerouslySetInnerHTML={{ __html: idCard.qr.svg }}
                      />
                    ) : idCard?.qr?.png_data_uri ? (
                      <img
                        src={idCard.qr.png_data_uri}
                        alt="QR Code"
                        className="w-32 h-32 object-contain"
                      />
                    ) : null}
                  </div>
                  <span className="text-[9.5px] font-extrabold font-mono text-teal-800 tracking-widest uppercase mt-1">
                    SCAN FOR ATTENDANCE
                  </span>
                  <span className="text-[8.5px] text-slate-400 font-medium">{t('employees.scanAttendance')}</span>
                </div>

                {/* ID Code & Footer Info */}
                <div className="w-full border-t border-slate-200/80 pt-2.5 grid grid-cols-2 gap-2 text-[10.5px]">
                  <div className="text-left">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">{t('employees.employeeIdLabel')}</span>
                    <span className="font-mono font-black text-slate-900 text-xs">
                      {emp.employee_code}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">{t('employees.hotlineLabel')}</span>
                    <span className="font-semibold text-slate-700 text-xs font-mono">
                      {emp.emergency_phone || org?.phone || '+855 42 941 234'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Hospital Footer Bar */}
              <div className="bg-slate-50 border-t border-slate-200/80 px-4 py-2 text-center text-[9px] text-slate-500 font-medium leading-tight">
                {org?.address || t('employees.defaultHospitalAddress')} • {org?.phone || '+855 42 941 234'}
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center max-w-sm no-print">
              {t('employees.idCardTip')}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeIdCardModal;
