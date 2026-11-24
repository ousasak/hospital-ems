import React from 'react';
import { CheckCircle2, Loader2, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocaleStore } from '@/stores/localeStore';
import { confirmAction } from '@/stores/confirmStore';

interface SettingsFormFooterProps {
  isDirty: boolean;
  isSaving: boolean;
  readOnly?: boolean;
  borderTop?: boolean;
  onReset: () => void;
}

export const SettingsFormFooter: React.FC<SettingsFormFooterProps> = ({
  isDirty,
  isSaving,
  readOnly = false,
  borderTop = true,
  onReset,
}) => {
  const { t } = useLocaleStore();

  const handleResetClick = () => {
    if (!isDirty || isSaving) return;
    confirmAction({
      title: t('settings.common.resetConfirmTitle'),
      message: t('settings.common.resetConfirmDesc'),
      variant: 'warning',
      actionType: 'warning',
      confirmText: t('settings.common.resetConfirmAction'),
      cancelText: t('common.cancel'),
      onConfirm: () => {
        onReset();
      },
    });
  };

  if (readOnly) {
    return null;
  }

  return (
    <div
      className={`flex flex-col gap-3 ${
        borderTop ? 'border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30' : 'bg-white dark:bg-card'
      } px-6 py-4 sm:flex-row sm:items-center sm:justify-between`}
    >
      <div className="flex items-center gap-2 text-xs">
        {isDirty ? (
          <>
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-medium text-amber-700 dark:text-amber-400">
              {t('settings.common.unsavedChanges')}
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-muted-foreground">
              {t('settings.common.allSaved')}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleResetClick}
          disabled={!isDirty || isSaving}
          className="h-9 px-3.5 rounded-lg text-xs font-medium gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>{t('settings.common.resetChanges')}</span>
        </Button>

        <Button
          type="submit"
          size="sm"
          disabled={!isDirty || isSaving}
          className="h-9 px-4 rounded-lg text-xs font-semibold gap-1.5"
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          <span>
            {isSaving ? t('settings.common.saving') : t('settings.common.saveChanges')}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default SettingsFormFooter;
