import React from 'react';
import { Landmark, Calendar, ShieldCheck, Info } from 'lucide-react';
import { RegionalHoliday } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

interface RegionalHolidaysProps {
  holidays: RegionalHoliday[];
}

export const RegionalHolidays: React.FC<RegionalHolidaysProps> = ({ holidays }) => {
  // Helper to extract day and month for date badge
  const parseDateParts = (dateStr: string) => {
    const parts = dateStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      const day = parts[0];
      const month = parts[1];
      return { day, month };
    }
    return { day: dateStr, month: '' };
  };

  return (
    <Card className="min-w-0 shadow-2xs border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl">
      {/* Header */}
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
              <Landmark className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                ថ្ងៃឈប់សម្រាកបុណ្យជាតិ 🇰🇭
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                ប្រតិទិនផ្លូវការរាជរដ្ឋាភិបាលកម្ពុជា
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-[11px] font-semibold px-2 py-0.5 bg-teal-50/60 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800 shrink-0"
          >
            ឆ្នាំ ២០២៦
          </Badge>
        </div>
      </CardHeader>

      {/* Holiday List */}
      <CardContent className="space-y-3 pt-3.5">
        <div className="space-y-2">
          {holidays.map((h, idx) => {
            const { day, month } = parseDateParts(h.date);
            const isMultipleDays = day.includes('–') || day.includes('-');

            return (
              <div
                key={`${h.name}-${idx}`}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-850/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                {/* Date Square Badge */}
                <div className="flex flex-col items-center justify-center w-12 h-11 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 shrink-0 text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 leading-tight">
                    {month || 'ខែ'}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {day}
                  </span>
                </div>

                {/* Holiday Info */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {h.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                    <span>{h.date}</span>
                    <span>•</span>
                    <span className="text-teal-700 dark:text-teal-400 font-medium">
                      {isMultipleDays ? 'ឈប់សម្រាក ៣ ថ្ងៃ' : 'ឈប់សម្រាក ១ ថ្ងៃ'}
                    </span>
                  </div>
                </div>

                {/* Status indicator */}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 shrink-0">
                  ផ្លូវការ
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-3 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>មន្ទីរពេទ្យអនុវត្តតាមអនុក្រឹត្យស្ដីពីការឈប់សម្រាកការងារ</span>
        </div>
      </CardContent>
    </Card>
  );
};
