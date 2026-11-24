import React, { useState, useEffect, useRef } from 'react';
import {
  FileUp,
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useLocaleStore } from '@/stores/localeStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CloseButton } from '@/components/common/CloseButton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const DOCUMENT_CATEGORIES = [
  'Identity',
  'Employment',
  'Contracts',
  'Certifications',
  'Payroll',
  'Tax',
  'Policy',
  'Other HR Documents',
] as const;

export interface AddDocumentFormValues {
  employee_id: string;
  title: string;
  category: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  file: File | null;
}

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: any[];
  onSubmit: (values: AddDocumentFormValues) => void;
  isPending?: boolean;
}

export const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
  isOpen,
  onClose,
  employees,
  onSubmit,
  isPending = false,
}) => {
  const { t } = useLocaleStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<AddDocumentFormValues>({
    employee_id: '',
    title: '',
    category: 'Identity',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    status: 'Pending',
    file: null,
  });

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        employee_id: '',
        title: '',
        category: 'Identity',
        issue_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        status: 'Pending',
        file: null,
      });
      setImagePreviewUrl(null);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleFileChange = (file: File | null) => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }

    if (!file) {
      setForm((prev) => ({ ...prev, file: null }));
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error(
        t('documents.messages.errFileTooLarge')
      );
      return;
    }

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isImage && !isPdf) {
      toast.error(
        t(
          'documents.messages.errUnsupportedFileType',
          t('documents.addModal.fileTypeErr')
        )
      );
      return;
    }

    if (isImage) {
      const preview = URL.createObjectURL(file);
      setImagePreviewUrl(preview);
    }

    setForm((prev) => ({
      ...prev,
      file,
      title: prev.title.trim() ? prev.title : file.name.replace(/\.[^/.]+$/, ''),
    }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0] || null;
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employee_id) {
      toast.error(t('documents.messages.errSelectEmployee'));
      return;
    }
    if (!form.title.trim()) {
      toast.error(t('documents.messages.errEnterTitle'));
      return;
    }
    if (!form.category) {
      toast.error(t('documents.messages.errSelectCategory'));
      return;
    }
    if (!form.file) {
      toast.error(t('documents.messages.errAttachRealFile'));
      return;
    }
    onSubmit(form);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-card border border-border shadow-2xl rounded-2xl [&>button:last-child]:hidden font-sans">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
                <FileUp size={20} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {t('documents.addModal.title')}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {t(
                    'documents.addModal.subtitle',
                    t('documents.addModal.subtitle')
                  )}
                </DialogDescription>
              </div>
            </div>
            <CloseButton onClose={onClose} size="md" variant="default" />
          </div>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* 1. Target Employee */}
          <div className="space-y-1.5">
            <label
              htmlFor="doc-employee"
              className="font-semibold text-foreground text-xs block"
            >
              {t('documents.addModal.targetEmployee')}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <select
              id="doc-employee"
              required
              value={form.employee_id}
              onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer shadow-2xs"
            >
              <option value="">{t('documents.addModal.selectEmployee')}</option>
              {employees?.map((emp: any) => {
                const name =
                  emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
                const dept =
                  emp.primary_assignment?.department?.name || emp.department?.name || '';
                return (
                  <option key={emp.id} value={emp.id}>
                    {name} ({emp.employee_code}){dept ? ` — ${dept}` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 2. Document Title */}
          <div className="space-y-1.5">
            <label
              htmlFor="doc-title"
              className="font-semibold text-foreground text-xs block"
            >
              {t('documents.addModal.documentTitle')}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              id="doc-title"
              type="text"
              required
              placeholder={t(
                'documents.addModal.titlePlaceholder',
                t('documents.addModal.titlePlaceholder')
              )}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-2xs"
            />
          </div>

          {/* 3. Category & Initial Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label
                htmlFor="doc-category"
                className="font-semibold text-foreground text-xs block"
              >
                {t('documents.addModal.category')}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <select
                id="doc-category"
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer shadow-2xs"
              >
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {t(`documents.categories.${cat}`, cat)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="doc-status"
                className="font-semibold text-foreground text-xs block"
              >
                {t('documents.addModal.initialStatus')}
              </label>
              <select
                id="doc-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer shadow-2xs"
              >
                <option value="Verified">
                  {t('documents.statuses.Verified')}
                </option>
                <option value="Pending">
                  {t('documents.statuses.Pending')}
                </option>
                <option value="Expiring Soon">
                  {t('documents.statuses.Expiring Soon')}
                </option>
              </select>
            </div>
          </div>

          {/* 4. Issue Date & Expiry Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label
                htmlFor="doc-issue-date"
                className="font-semibold text-foreground text-xs block"
              >
                {t('documents.addModal.issueDate')}
              </label>
              <input
                id="doc-issue-date"
                type="date"
                value={form.issue_date}
                onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="doc-expiry-date"
                className="font-semibold text-foreground text-xs block"
              >
                {t('documents.addModal.expiryDate')}
              </label>
              <input
                id="doc-expiry-date"
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* 5. Real File Attachment with Instant Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground text-xs block">
                {t(
                  'documents.addModal.fileAttachment',
                  t('documents.addModal.fileAttachment')
                )}{' '}
                <span className="text-rose-500">*</span>
              </label>
              {form.file && (
                <button
                  type="button"
                  onClick={() => {
                    handleFileChange(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-[11px] font-medium text-rose-500 hover:text-rose-600 hover:underline inline-flex items-center gap-1"
                >
                  <X size={12} />
                  {t('documents.addModal.changeFile')}
                </button>
              )}
            </div>

            {!form.file ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-teal-500/60 hover:bg-muted/20'
                }`}
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 mb-2.5">
                  <Upload size={22} />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleFileChange(file);
                  }}
                  className="hidden"
                />
                <span className="text-xs font-bold text-foreground">
                  {t('documents.addModal.dropzonePrompt')}
                </span>
                <span className="text-[11px] text-muted-foreground mt-1">
                  {t(
                    'documents.addModal.dropzoneSupport',
                    t('documents.addModal.dropzoneSupport')
                  )}
                </span>
              </div>
            ) : (
              <div className="rounded-xl border border-teal-500/30 bg-teal-50/30 dark:bg-teal-950/20 p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {imagePreviewUrl ? (
                    <div className="size-14 rounded-lg overflow-hidden border border-border shrink-0 bg-white shadow-2xs">
                      <img
                        src={imagePreviewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="size-11 rounded-xl bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20 flex items-center justify-center shrink-0">
                      <FileText size={22} />
                    </div>
                  )}

                  <div className="min-w-0">
                    <span className="block font-semibold text-foreground text-xs truncate">
                      {form.file.name}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground font-mono">
                      <span className="inline-flex items-center gap-1 font-semibold text-teal-700 dark:text-teal-400">
                        <CheckCircle2 size={12} />
                        {imagePreviewUrl
                          ? t('documents.addModal.imageBadge')
                          : t('documents.addModal.pdfBadge')}
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(form.file.size)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleFileChange(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="h-8 px-2 text-muted-foreground hover:text-rose-600 rounded-lg shrink-0"
                >
                  <X size={15} />
                </Button>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="h-10 px-4 rounded-xl text-xs font-semibold"
            >
              {t('documents.addModal.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isPending || !form.file}
              className="h-10 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              {isPending
                ? t('documents.addModal.submitting')
                : t('documents.addModal.submit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDocumentModal;
