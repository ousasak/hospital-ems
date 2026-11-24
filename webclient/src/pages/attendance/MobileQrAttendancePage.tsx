import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from '@/i18n';
import { qrAttendanceService, QrAttendanceSubmitResult } from '@/services/qrAttendanceService';
import { useAuthStore } from '@/stores/authStore';
import { useLocaleStore } from '@/stores/localeStore';
import { useThemeStore } from '@/stores/themeStore';
import { Button } from '@/components/ui/button';
import {
  QrCode,
  Wifi,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Building,
  User,
  HeartPulse,
  Navigation,
  Globe,
  Sun,
  Moon,
} from 'lucide-react';
import { toast } from 'sonner';

export const MobileQrAttendancePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { locale, setLocale } = useLocaleStore();
  const { theme, toggleTheme } = useThemeStore();

  // Clock state (Phnom Penh UTC+7)
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Geolocation state
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Result state
  const [punchResult, setPunchResult] = useState<QrAttendanceSubmitResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Validate QR Token with Backend
  const {
    data: precheck,
    isLoading: isValidatingToken,
    error: tokenError,
    refetch: recheckToken,
  } = useQuery({
    queryKey: ['qr-token-validate', token],
    queryFn: async () => {
      if (!token) throw new Error('Missing QR token');
      return await qrAttendanceService.validateQrToken(token);
    },
    enabled: !!token,
    retry: false,
  });

  // Request GPS Geolocation from Smartphone Browser
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError(t('attendance.geoNotSupported', 'ឧបករណ៍របស់អ្នកមិនគាំទ្រប្រព័ន្ធកំណត់ទីតាំង GPS ទេ (Geolocation not supported)'));
      return;
    }

    setIsDetectingLocation(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setIsDetectingLocation(false);
      },
      (error) => {
        setIsDetectingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError(t('attendance.geoDenied', 'សូមអនុញ្ញាតសិទ្ធិចូលប្រើប្រាស់ទីតាំង GPS លើទូរស័ព្ទរបស់អ្នក ដើម្បីផ្ទៀងផ្ទាត់វត្តមាន (Location permission denied)'));
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError(t('attendance.geoUnavailable', 'មិនអាចចាប់សញ្ញា GPS បានទេ។ សូមសាកល្បងដើរជិតបង្អួច ឬចេញក្រៅអគារ (Position unavailable)'));
            break;
          case error.TIMEOUT:
            setGeoError(t('attendance.geoTimeout', 'ការចាប់ទីតាំង GPS យឺតពេល។ សូមចុចសាកល្បងម្តងទៀត (GPS timeout)'));
            break;
          default:
            setGeoError(t('attendance.geoError', 'មានបញ្ហាក្នុងការចាប់ទីតាំង GPS'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  }, [t]);

  useEffect(() => {
    // Automatically trigger GPS detection on mount
    requestLocation();
  }, [requestLocation]);

  // Submit Attendance Mutation
  const punchMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Token is missing');
      if (!coords) throw new Error('GPS location is required');

      return await qrAttendanceService.submitAttendance({
        token,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        device_metadata: navigator.userAgent,
      });
    },
    onSuccess: (data) => {
      setPunchResult(data);
      setErrorMessage(null);
      toast.success(data.message);
      recheckToken();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.network?.[0] ||
        err?.response?.data?.errors?.location?.[0] ||
        err?.response?.data?.errors?.ownership?.[0] ||
        err?.response?.data?.errors?.duplicate?.[0] ||
        t('attendance.punchFailed', 'ការកត់ត្រាវត្តមានមិនជោគជ័យ');
      setErrorMessage(msg);
      toast.error(msg);
    },
  });

  const emp = precheck?.employee;
  const shift = precheck?.shift;
  const todayRecord = precheck?.today_record;
  const networkCheck = precheck?.network_precheck;
  const suggestedAction = precheck?.suggested_action;

  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/70 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-foreground flex flex-col items-center justify-between p-3 sm:p-5">
      {/* ─── Top Brand Bar ─── */}
      <header className="w-full max-w-md flex items-center justify-between py-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <HeartPulse size={18} />
          </div>
          <div>
            <span className="font-extrabold text-xs text-foreground tracking-tight block">
              StaffStream EMS
            </span>
            <span className="text-[10px] text-teal-700 dark:text-teal-400 font-medium block">
              {t('attendance.hospitalPortal', 'មន្ទីរពេទ្យកម្ពុជា-ចិន ត្បូងឃ្មុំ')}
            </span>
          </div>
        </div>

        {/* Right utility buttons: Locale toggle & Theme toggle */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setLocale(locale === 'km' ? 'en' : 'km')}
            className="h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-card text-[11px] font-bold text-foreground hover:bg-muted/40 transition-colors"
          >
            {locale === 'km' ? 'EN' : 'ខ្មែរ'}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-800 bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
      </header>

      {/* ─── Main Content Container ─── */}
      <main className="w-full max-w-md my-4 space-y-4">
        {/* Live Digital Clock Card */}
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border text-center relative overflow-hidden">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 mb-1">
            <Clock size={13} />
            <span>
              {currentTime.toLocaleDateString(locale === 'km' ? 'km-KH' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-foreground">
            {currentTime.toLocaleTimeString('en-US', { hour12: false })}
          </div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1 block">
            Asia/Phnom_Penh (UTC+7)
          </span>
        </div>

        {/* ─── Error / Loading Screen ─── */}
        {isValidatingToken ? (
          <div className="bg-card rounded-2xl p-8 border border-border text-center space-y-3">
            <div className="h-8 w-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <h4 className="text-sm font-bold text-foreground">
              {t('attendance.verifyingQr', 'កំពុងផ្ទៀងផ្ទាត់កូដ QR និងអត្តសញ្ញាណ...')}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t('attendance.pleaseWait', 'សូមរង់ចាំបន្តិច ប្រព័ន្ធកំពុងពិនិត្យសុវត្ថិភាព')}
            </p>
          </div>
        ) : tokenError ? (
          /* Invalid / Mismatched Token Card */
          <div className="bg-rose-50 dark:bg-rose-950/40 rounded-2xl p-6 border border-rose-200 dark:border-rose-900 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            <h4 className="text-sm font-bold text-rose-700 dark:text-rose-300">
              {t('attendance.qrInvalidTitle', 'កូដ QR មិនត្រឹមត្រូវ ឬគ្មានសិទ្ធិប្រើប្រាស់')}
            </h4>
            <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
              {(tokenError as any)?.response?.data?.errors?.ownership?.[0] ||
                (tokenError as any)?.response?.data?.message ||
                t(
                  'attendance.qrInvalidDesc',
                  'កូដ QR នេះអាចត្រូវបានដកហូត ផុតកំណត់ ឬជាកូដរបស់បុគ្គលិកផ្សេងទៀត។'
                )}
            </p>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="rounded-xl text-xs"
              >
                {t('navigation.dashboard', 'ត្រឡប់ទៅផ្ផ្ទាំងគ្រប់គ្រង')}
              </Button>
            </div>
          </div>
        ) : (
          /* Verified Employee Attendance Flow */
          <>
            {/* Employee Profile Header Card */}
            {emp && (
              <div className="bg-card rounded-2xl p-4 border border-border shadow-2xs flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {emp.avatar_url && !emp.avatar_url.includes('unsplash') ? (
                    <img src={emp.avatar_url} alt={emp.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={22} className="text-teal-700 dark:text-teal-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-foreground truncate">{emp.full_name}</h3>
                    <span className="text-[10px] font-mono font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 px-1.5 py-0.2 rounded border border-teal-200 dark:border-teal-800">
                      {emp.employee_code}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {emp.position} • {emp.department}
                  </p>
                  {shift && (
                    <span className="text-[10.5px] font-medium text-emerald-700 dark:text-emerald-400 block mt-0.5">
                      {t('shifts.title', 'វេនការងារ')}: {shift.name} ({shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)})
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* ─── Mandatory Security Validation Badges ─── */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. Hospital Wi-Fi Indicator */}
              <div
                className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                  networkCheck?.is_authorized_hospital_wifi
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Wifi size={14} className={networkCheck?.is_authorized_hospital_wifi ? 'text-emerald-600' : 'text-rose-600'} />
                    <span>{t('attendance.hospitalWifi', 'Wi-Fi មន្ទីរពេទ្យ')}</span>
                  </div>
                  {networkCheck?.is_authorized_hospital_wifi ? (
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </div>
                <span className="text-[11px] font-semibold">
                  {networkCheck?.is_authorized_hospital_wifi
                    ? t('attendance.wifiConnected', 'បានភ្ជាប់ Wi-Fi មន្ទីរពេទ្យ')
                    : t('attendance.wifiRejected', 'មិនមែន Wi-Fi មន្ទីរពេទ្យ')}
                </span>
                <span className="text-[9.5px] font-mono text-muted-foreground truncate mt-0.5">
                  IP: {networkCheck?.client_ip || 'Checking...'}
                </span>
              </div>

              {/* 2. GPS Geofence Indicator */}
              <div
                className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                  coords
                    ? 'bg-teal-50/60 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200'
                    : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <MapPin size={14} className={coords ? 'text-teal-600' : 'text-amber-600'} />
                    <span>{t('attendance.gpsLocation', 'ទីតាំង GPS')}</span>
                  </div>
                  {isDetectingLocation ? (
                    <RefreshCw size={11} className="animate-spin text-amber-600" />
                  ) : coords ? (
                    <span className="h-2 w-2 rounded-full bg-teal-500" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </div>
                <span className="text-[11px] font-semibold">
                  {isDetectingLocation
                    ? t('attendance.detectingGps', 'កំពុងចាប់ទីតាំង...')
                    : coords
                    ? `${t('attendance.gpsLocked', 'ចាប់បានទីតាំង')} (±${Math.round(coords.accuracy)}m)`
                    : t('attendance.gpsPending', 'រង់ចាំសញ្ញា GPS')}
                </span>
                <button
                  type="button"
                  onClick={requestLocation}
                  className="text-[9.5px] text-teal-700 dark:text-teal-400 font-bold hover:underline text-left mt-0.5 cursor-pointer"
                >
                  {t('common.retry', 'ចាប់ឡើងវិញ (Refresh GPS)')}
                </button>
              </div>
            </div>

            {/* GPS Error Alert */}
            {geoError && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600" />
                <div className="space-y-1">
                  <p className="leading-snug">{geoError}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={requestLocation}
                    className="h-6 text-[10px] px-2 rounded-lg"
                  >
                    {t('common.tryAgain', 'ព្យាយាមម្តងទៀត')}
                  </Button>
                </div>
              </div>
            )}

            {/* Error Message from Server */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                <div className="space-y-1">
                  <span className="font-bold block">
                    {t('attendance.punchRejected', 'ការកត់ត្រាវត្តមានត្រូវបានបដិសេធ')}
                  </span>
                  <p className="leading-snug">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* ─── Success Confirmation Card ─── */}
            {punchResult ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-2xl p-5 text-center space-y-3 animate-in zoom-in-95 duration-200">
                <div className="h-14 w-14 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-md">
                  <CheckCircle2 size={32} />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                    {punchResult.action === 'check_in'
                      ? t('attendance.checkInSuccessTitle', 'បានស្កេនចូលជោគជ័យ')
                      : t('attendance.checkOutSuccessTitle', 'បានស្កេនចេញជោគជ័យ')}
                  </span>
                  <h3 className="text-2xl font-extrabold text-emerald-950 dark:text-emerald-100 font-mono">
                    {punchResult.time}
                  </h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    {punchResult.message}
                  </p>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  {punchResult.network && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('attendance.hospitalWifi', 'Wi-Fi')}:</span>
                      <span className="font-semibold text-foreground">{punchResult.network}</span>
                    </div>
                  )}
                  {punchResult.geofence && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('attendance.hospitalZone', 'តំបន់')}:</span>
                      <span className="font-semibold text-foreground">{punchResult.geofence}</span>
                    </div>
                  )}
                  {punchResult.working_hours !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('attendance.workingHours', 'ម៉ោងធ្វើការ')}:</span>
                      <span className="font-bold text-teal-600 dark:text-teal-400">{punchResult.working_hours} ម៉ោង</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => navigate('/')}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs h-10 font-bold"
                >
                  {t('attendance.doneBackToDashboard', 'រួចរាល់ • ទៅផ្ទាំងគ្រប់គ្រង')}
                </Button>
              </div>
            ) : (
              /* ─── Big Action Button ─── */
              <div className="space-y-2 pt-1">
                {suggestedAction === 'completed' ? (
                  <div className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-center space-y-2 border border-slate-200 dark:border-slate-700">
                    <CheckCircle2 size={24} className="text-emerald-500 mx-auto" />
                    <h4 className="font-bold text-sm text-foreground">
                      {t('attendance.alreadyCompleted', 'វត្តមានថ្ងៃនេះបានបញ្ចប់ទាំងស្រុង')}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {t('attendance.completedDesc', 'លោកអ្នកបានស្កេនទាំងម៉ោងចូល និងម៉ោងចេញរួចរាល់ហើយសម្រាប់ថ្ងៃនេះ។')}
                    </p>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={() => punchMutation.mutate()}
                    disabled={
                      punchMutation.isPending ||
                      !coords ||
                      !networkCheck?.is_authorized_hospital_wifi
                    }
                    className={`w-full h-14 rounded-2xl text-base font-extrabold shadow-lg transition-all ${
                      suggestedAction === 'check_out'
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'
                        : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20'
                    }`}
                  >
                    {punchMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw size={18} className="animate-spin" />
                        <span>{t('attendance.processing', 'កំពុងកត់ត្រាវត្តមាន...')}</span>
                      </div>
                    ) : suggestedAction === 'check_out' ? (
                      <div className="flex items-center justify-center gap-2">
                        <LogOut size={20} />
                        <span>{t('attendance.confirmCheckOut', 'បញ្ជាក់ស្កេនចេញ (Confirm Check-out)')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <QrCode size={20} />
                        <span>{t('attendance.confirmCheckIn', 'បញ្ជាក់ស្កេនចូល (Confirm Check-in)')}</span>
                      </div>
                    )}
                  </Button>
                )}

                {!networkCheck?.is_authorized_hospital_wifi && (
                  <p className="text-[11px] text-center text-rose-600 dark:text-rose-400 font-medium">
                    {t(
                      'attendance.wifiRequiredWarning',
                      '* តម្រូវឱ្យភ្ជាប់ Wi-Fi មន្ទីរពេទ្យជាមុនសិន ទើបអាចស្កេនវត្តមានបាន។'
                    )}
                  </p>
                )}
                {!coords && (
                  <p className="text-[11px] text-center text-amber-600 dark:text-amber-400 font-medium">
                    {t(
                      'attendance.gpsRequiredWarning',
                      '* តម្រូវឱ្យបើក GPS និងអនុញ្ញាតទីតាំងលើស្មាតហ្វូនរបស់អ្នក។'
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Today's Attendance State Summary */}
            {todayRecord && (
              <div className="bg-card rounded-2xl p-4 border border-border shadow-2xs space-y-2 text-xs">
                <span className="font-bold text-foreground block">
                  {t('attendance.todayStatus', 'ស្ថានភាពវត្តមានថ្ងៃនេះ')}
                </span>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div className="bg-muted/40 p-2.5 rounded-xl border border-border">
                    <span className="text-[10px] uppercase font-bold block">{t('attendance.checkIn', 'ស្កេនចូល')}</span>
                    <span className="text-xs font-semibold text-foreground">
                      {todayRecord.check_in_time
                        ? new Date(todayRecord.check_in_time).toLocaleTimeString('en-US', { hour12: false })
                        : '—'}
                    </span>
                  </div>
                  <div className="bg-muted/40 p-2.5 rounded-xl border border-border">
                    <span className="text-[10px] uppercase font-bold block">{t('attendance.checkOut', 'ស្កេនចេញ')}</span>
                    <span className="text-xs font-semibold text-foreground">
                      {todayRecord.check_out_time
                        ? new Date(todayRecord.check_out_time).toLocaleTimeString('en-US', { hour12: false })
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer className="w-full max-w-md text-center py-2 text-[10.5px] text-muted-foreground border-t border-border space-y-1">
        <p>
          {t('attendance.hospitalFooterNotice', 'ប្រព័ន្ធវត្តមានផ្ទាល់ខ្លួនបុគ្គលិក • មន្ទីរពេទ្យកម្ពុជា-ចិន ត្បូងឃ្មុំ')}
        </p>
        <p className="text-[9.5px]">
          StaffStream EMS Enterprise v1.0 • Secure Personal QR Protocol
        </p>
      </footer>
    </div>
  );
};

export default MobileQrAttendancePage;

