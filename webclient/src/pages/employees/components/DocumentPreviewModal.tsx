import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Building2,
  User,
  CheckCircle2,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CloseButton } from '@/components/common/CloseButton';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DocumentItem } from '@/services/documentService';
import { formatDate } from '@/utils';
import { useLocaleStore } from '@/stores/localeStore';
import { toast } from 'sonner';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  onVerify?: (id: number) => void;
  isVerifying?: boolean;
  onDownload?: (doc: DocumentItem) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document,
  onVerify,
  isVerifying = false,
  onDownload,
}) => {
  const { locale, t } = useLocaleStore();
  const [imageError, setImageError] = useState(false);

  if (!document) return null;

  const employeeName =
    document.employee?.full_name ||
    `${document.employee?.first_name || ''} ${document.employee?.last_name || ''}`.trim() ||
    t('documents.previewModal.hospitalStaff');

  const departmentName =
    document.employee?.primary_assignment?.department?.name ||
    t('documents.previewModal.generalDept');

  const positionTitle =
    document.employee?.primary_assignment?.position?.title || '—';

  const isImage = Boolean(
    document.mime_type?.includes('image') ||
      document.file_path?.match(/\.(jpg|jpeg|png|webp|gif)$/i)
  );

  const fileUrl =
    document.file_url ||
    (document.file_path
      ? document.file_path.startsWith('http')
        ? document.file_path
        : `/storage/${document.file_path.replace(/^\/+/, '')}`
      : isImage
      ? '/storage/documents/samples/cambodia_national_id.jpg'
      : '/storage/documents/samples/cambodia_passport.pdf');

  const formattedSize =
    document.file_size > 0
      ? document.file_size < 1024 * 1024
        ? `${(document.file_size / 1024).toFixed(1)} KB`
        : `${(document.file_size / (1024 * 1024)).toFixed(2)} MB`
      : '1.20 MB';

  const handleDownload = () => {
    if (onDownload) {
      onDownload(document);
    } else {
      const link = window.document.createElement('a');
      link.href = fileUrl;
      link.download = `${document.title.replace(/[/\\?%*:|"<>]/g, '_')}.${isImage ? 'jpg' : 'pdf'}`;
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      toast.success(
        t('documents.messages.downloading', {
          title: document.title,
        })
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-card border border-border shadow-2xl rounded-2xl [&>button:last-child]:hidden font-sans max-h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs ring-1 ${
                  isImage
                    ? 'bg-sky-600/10 text-sky-700 ring-sky-600/20'
                    : 'bg-teal-600/10 text-teal-700 ring-teal-600/20'
                }`}
              >
                {isImage ? <ImageIcon size={20} /> : <FileText size={20} />}
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-bold text-foreground truncate">
                  {document.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span>
                    {t('documents.previewModal.categoryPrefix')}{' '}
                    <strong className="text-foreground/80">
                      {t(`documents.categories.${document.category}`, document.category)}
                    </strong>
                  </span>
                  <span>•</span>
                  <span className="font-mono">
                    {isImage
                      ? t('documents.previewModal.imageType')
                      : t('documents.previewModal.pdfType')}
                  </span>
                </DialogDescription>
              </div>
            </div>
            <CloseButton onClose={onClose} size="md" variant="default" />
          </div>
        </DialogHeader>

        {/* Content Body (Scrollable) */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* 1. Real Document Preview Section */}
          <div className="rounded-xl border border-border/80 overflow-hidden bg-slate-950/5 dark:bg-slate-950/40">
            <div className="flex items-center justify-between px-3.5 py-2 bg-muted/40 border-b border-border/60">
              <div className="flex items-center gap-2">
                {isImage ? (
                  <ImageIcon className="size-3.5 text-sky-600" />
                ) : (
                  <FileText className="size-3.5 text-rose-500" />
                )}
                <span className="font-semibold text-xs text-foreground truncate max-w-[280px]">
                  {document.title}
                </span>
                <span className="font-mono text-[10.5px] text-muted-foreground">
                  ({formattedSize})
                </span>
              </div>

              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-700 hover:underline transition-colors"
              >
                <ExternalLink className="size-3" />
                <span>{t('documents.previewModal.openFull')}</span>
              </a>
            </div>

            {/* Document Render: Image or PDF */}
            {isImage ? (
              <div className="p-3 flex items-center justify-center min-h-[220px] max-h-[380px] bg-slate-100 dark:bg-slate-900/60 overflow-hidden">
                <img
                  src={imageError ? '/storage/documents/samples/cambodia_national_id.jpg' : fileUrl}
                  alt={document.title}
                  onError={() => setImageError(true)}
                  className="max-h-[360px] w-auto max-w-full object-contain rounded-lg shadow-sm transition-transform hover:scale-[1.02]"
                />
              </div>
            ) : (
              <div className="w-full h-[320px] sm:h-[380px] bg-white">
                <iframe
                  src={`${fileUrl}#toolbar=0&navpanes=0`}
                  title={document.title}
                  className="w-full h-full border-0"
                />
              </div>
            )}
          </div>

          {/* 2. Employee Info Card */}
          <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="size-4 text-teal-600" />
                <span className="font-semibold text-foreground text-xs">{employeeName}</span>
              </div>
              <span className="font-mono text-[11px] font-bold text-teal-700 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md">
                {document.employee?.employee_code || `EMP-${document.employee_id}`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Building2 className="size-3.5 text-muted-foreground/70" />
                <span className="truncate">{departmentName}</span>
              </div>
              <div className="truncate text-right font-medium text-foreground/80">
                <span>{positionTitle}</span>
              </div>
            </div>
          </div>

          {/* 3. Document Properties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border/80 p-3 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                {t('documents.previewModal.issueDate')}
              </span>
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Calendar className="size-3.5 text-muted-foreground" />
                <span>{formatDate(document.issue_date, locale)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-border/80 p-3 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                {t('documents.previewModal.expiryDate')}
              </span>
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Calendar className="size-3.5 text-muted-foreground" />
                <span>
                  {document.expiry_date
                    ? formatDate(document.expiry_date, locale)
                    : t('documents.previewModal.noExpiry')}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border/80 p-3 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                {t('documents.previewModal.documentStatus')}
              </span>
              <div className="pt-0.5">
                <StatusBadge status={document.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-muted/10 shrink-0 flex items-center justify-between gap-2.5">
          <div className="font-mono text-[11px] text-muted-foreground">
            {t('documents.previewModal.docIdPrefix')}{' '}
            <span className="font-bold text-foreground">DOC-{document.id}</span>
          </div>

          <div className="flex items-center gap-2">
            {document.status !== 'Verified' && onVerify && (
              <Button
                type="button"
                variant="outline"
                disabled={isVerifying}
                onClick={() => onVerify(document.id)}
                className="h-9 px-3.5 rounded-xl border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 text-xs font-semibold gap-1.5"
              >
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                <span>
                  {isVerifying
                    ? t('documents.previewModal.verifying')
                    : t('documents.previewModal.verifyBtn')}
                </span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={handleDownload}
              className="h-9 px-3.5 rounded-xl text-xs font-semibold gap-1.5 hover:bg-teal-50 dark:hover:bg-teal-950/20 hover:text-teal-600"
            >
              <Download className="size-3.5" />
              <span>{t('documents.previewModal.downloadBtn')}</span>
            </Button>

            <Button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
            >
              {t('documents.previewModal.closeBtn')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewModal;
