import React from 'react';
import {
  AlertTriangle,
  Info,
  CheckCircle2,
  Trash2,
  LogOut,
  ShieldAlert,
  RotateCcw,
  Archive,
  Loader2,
} from 'lucide-react';
import { useTranslation, translateString } from '@/i18n';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CloseButton } from './CloseButton';
import { cn } from '@/utils';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';
export type ConfirmActionType =
  | 'delete'
  | 'logout'
  | 'revoke'
  | 'warning'
  | 'restore'
  | 'archive'
  | 'info'
  | 'success';

export interface ConfirmDialogProps {
  open?: boolean;
  isOpen?: boolean;
  variant?: ConfirmVariant;
  actionType?: ConfirmActionType;
  title?: string;
  subtitle?: string;
  message?: React.ReactNode;
  itemName?: string;
  warningText?: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  isPending?: boolean;
  loading?: boolean;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

interface ActionConfig {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
  badgeBg: string;
  button: string;
}

const getActionConfig = (actionType: ConfirmActionType, variant: ConfirmVariant): ActionConfig => {
  switch (actionType) {
    case 'logout':
      return {
        icon: LogOut,
        iconColor: 'text-rose-600 dark:text-rose-400',
        badgeBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400',
        button: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs',
      };
    case 'revoke':
      return {
        icon: ShieldAlert,
        iconColor: 'text-rose-600 dark:text-rose-400',
        badgeBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400',
        button: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs',
      };
    case 'delete':
      return {
        icon: Trash2,
        iconColor: 'text-rose-600 dark:text-rose-400',
        badgeBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400',
        button: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs',
      };
    case 'restore':
      return {
        icon: RotateCcw,
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400',
        button: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs',
      };
    case 'archive':
      return {
        icon: Archive,
        iconColor: 'text-purple-600 dark:text-purple-400',
        badgeBg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50 text-purple-600 dark:text-purple-400',
        button: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-xs',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        iconColor: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400',
        button: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-xs',
      };
    case 'success':
      return {
        icon: CheckCircle2,
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400',
        button: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs',
      };
    case 'info':
    default:
      if (variant === 'danger') {
        return {
          icon: Trash2,
          iconColor: 'text-rose-600 dark:text-rose-400',
          badgeBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400',
          button: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs',
        };
      }
      if (variant === 'warning') {
        return {
          icon: AlertTriangle,
          iconColor: 'text-amber-600 dark:text-amber-400',
          badgeBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400',
          button: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-xs',
        };
      }
      if (variant === 'success') {
        return {
          icon: CheckCircle2,
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400',
          button: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs',
        };
      }
      return {
        icon: Info,
        iconColor: 'text-teal-600 dark:text-teal-400',
        badgeBg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900/50 text-teal-600 dark:text-teal-400',
        button: 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-xs',
      };
  }
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  isOpen,
  variant = 'danger',
  actionType,
  title,
  subtitle,
  message,
  itemName,
  warningText,
  confirmText,
  confirmLabel,
  cancelText,
  cancelLabel,
  isPending = false,
  loading = false,
  icon: CustomIcon,
  onConfirm,
  onCancel,
  onClose,
}) => {
  const { t } = useTranslation(['common']);
  const isModalOpen = open !== undefined ? open : Boolean(isOpen);
  const handleCancel = onCancel || onClose || (() => {});
  const isExecuting = isPending || loading;

  const detectedActionType: ConfirmActionType =
    actionType ||
    (variant === 'danger'
      ? 'delete'
      : variant === 'warning'
      ? 'warning'
      : variant === 'success'
      ? 'success'
      : 'info');

  const config = getActionConfig(detectedActionType, variant);
  const VariantIcon = CustomIcon || config.icon;

  const effectiveConfirmText = confirmText || confirmLabel;
  const effectiveCancelText = cancelText || cancelLabel;

  const getTitle = () => {
    if (title) return translateString(t(title, { defaultValue: title }));
    if (detectedActionType === 'delete' || variant === 'danger') {
      return t('confirm.deleteTitle', 'បញ្ជាក់ការលុប');
    }
    if (detectedActionType === 'logout') {
      return t('confirm.logoutTitle', 'បញ្ជាក់ការចាកចេញ');
    }
    return t('confirm.defaultTitle', 'តើអ្នកប្រាកដទេ?');
  };

  const getSubtitleContent = (): React.ReactNode => {
    if (subtitle) return translateString(t(subtitle, { defaultValue: subtitle }));
    if (itemName) {
      return (
        <>
          <span className="font-semibold text-foreground">"{itemName}"</span>{' '}
          {t('confirm.itemDeleted', 'នឹងត្រូវបានដកចេញពីប្រព័ន្ធ។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។')}
        </>
      );
    }
    if (warningText) {
      return translateString(t(warningText, { defaultValue: warningText }));
    }
    if (detectedActionType === 'delete' || variant === 'danger') {
      return t('confirm.deleteDescription', 'ធាតុនេះនឹងត្រូវបានដកចេញពីប្រព័ន្ធ។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។');
    }
    return null;
  };

  const getCancel = () => {
    if (effectiveCancelText) return translateString(t(effectiveCancelText, { defaultValue: effectiveCancelText }));
    return t('common.cancel', 'បោះបង់');
  };

  const getConfirm = () => {
    if (effectiveConfirmText) return translateString(t(effectiveConfirmText, { defaultValue: effectiveConfirmText }));
    if (detectedActionType === 'delete' || variant === 'danger') {
      return t('common.delete', 'លុបចេញ');
    }
    return t('common.confirm', 'យល់ព្រម');
  };

  const subtitleNode = getSubtitleContent();

  return (
    <Dialog open={isModalOpen} onOpenChange={(openVal) => !openVal && !isExecuting && handleCancel()}>
      <DialogContent className="sm:max-w-[440px] p-0 gap-0 overflow-hidden bg-card border border-border shadow-2xl rounded-2xl [&>button:last-child]:hidden font-sans">
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-start justify-between gap-3 bg-card border-b border-border/50">
          <div className="flex items-start gap-3.5 flex-1 min-w-0 pr-1">
            <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs', config.badgeBg)}>
              <VariantIcon size={20} className={config.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-bold text-foreground leading-snug">
                {getTitle()}
              </DialogTitle>
              {subtitleNode && (
                <DialogDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {subtitleNode}
                </DialogDescription>
              )}
            </div>
          </div>
          <CloseButton
            onClose={handleCancel}
            disabled={isExecuting}
            size="md"
            variant="default"
            color="rose"
            className="shrink-0 -mt-1 -mr-1"
          />
        </div>

        {/* Optional Warning Banner if both warningText and itemName were provided */}
        {warningText && itemName && (
          <div className="mx-5 sm:mx-6 my-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span className="leading-relaxed">
              {translateString(t(warningText, { defaultValue: warningText }))}
            </span>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className="px-5 sm:px-6 py-3.5 text-xs text-foreground/90 leading-relaxed bg-muted/15 border-b border-border/50">
            {typeof message === 'string' ? translateString(t(message, { defaultValue: message })) : message}
          </div>
        )}

        {/* Actions Footer */}
        <div className="p-4 sm:px-6 sm:py-4 bg-muted/30 dark:bg-muted/15 border-t border-border/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isExecuting}
            className="h-9 min-w-[76px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-card hover:bg-muted text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs cursor-pointer transition-all disabled:opacity-50 inline-flex items-center justify-center"
          >
            {getCancel()}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isExecuting}
            className={cn(
              'h-9 min-w-[84px] px-5 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-[0.98] inline-flex items-center justify-center gap-1.5',
              config.button
            )}
          >
            {isExecuting && (
              <Loader2 size={14} className="animate-spin" />
            )}
            <span>{getConfirm()}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ConfirmModal = ConfirmDialog;
export default ConfirmDialog;
