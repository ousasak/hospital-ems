import React from 'react';
import { useThemeStore, ColorPreset } from '../../stores/themeStore';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Palette, Check, Sun, Moon } from 'lucide-react';
import { cn } from '@/utils';
import { useTranslation } from '../../i18n';

export const ThemeCustomizer: React.FC = () => {
  const { t } = useTranslation();
  const { colorPreset, setColorPreset, theme, setTheme } = useThemeStore();

  const presets: { id: ColorPreset; labelKey: string; colorClass: string }[] = [
    { id: 'emerald', labelKey: 'theme.emerald', colorClass: 'bg-emerald-500' },
    { id: 'blue', labelKey: 'theme.blue', colorClass: 'bg-blue-600' },
    { id: 'violet', labelKey: 'theme.violet', colorClass: 'bg-violet-600' },
    { id: 'rose', labelKey: 'theme.rose', colorClass: 'bg-rose-500' },
    { id: 'orange', labelKey: 'theme.orange', colorClass: 'bg-orange-500' },
    { id: 'slate', labelKey: 'theme.slate', colorClass: 'bg-slate-600' },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={t('theme.customizer', 'Customize theme')}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Palette className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-4 shadow-xl">
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {t('theme.customizer', 'Theme Customizer')}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t('theme.subtitle', 'Customize colors and interface appearance.')}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">{t('theme.colorMode', 'Color Mode')}</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                className="h-8 gap-1.5 text-xs font-medium"
                onClick={() => setTheme('light')}
              >
                <Sun className="h-3.5 w-3.5" />
                {t('theme.light', 'Light')}
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                className="h-8 gap-1.5 text-xs font-medium"
                onClick={() => setTheme('dark')}
              >
                <Moon className="h-3.5 w-3.5" />
                {t('theme.dark', 'Dark')}
              </Button>
            </div>
          </div>

          {/* Color Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">{t('theme.colorAccent', 'Color Accent')}</label>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((preset) => {
                const isActive = colorPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setColorPreset(preset.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border p-1.5 text-xs font-medium transition-all hover:bg-accent/50',
                      isActive ? 'border-primary ring-1 ring-primary' : 'border-border'
                    )}
                  >
                    <span className={cn('h-3.5 w-3.5 rounded-full shrink-0 flex items-center justify-center', preset.colorClass)}>
                      {isActive && <Check className="h-2.5 w-2.5 text-white" />}
                    </span>
                    <span className="truncate text-[11px]">{t(preset.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

