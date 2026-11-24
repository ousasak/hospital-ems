import React, { useState, useEffect, useCallback, useRef } from 'react';
import jsQR from 'jsqr';
import { GlobalModal } from '@/components/common/GlobalModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  QrCode,
  Camera,
  CameraOff,
  FlipHorizontal,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  Upload,
  AlertCircle,
  ShieldCheck,
  Calendar,
  User,
} from 'lucide-react';
import {
  qrAttendanceService,
  EmployeeQrDetails,
  QrAttendanceSubmitResult,
} from '@/services/qrAttendanceService';
import { sound } from '@/utils/sound';
import { toast } from 'sonner';

interface QrAttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: 'scan' | 'card' | 'manual';
  employeeId?: number;
  todayData?: any;
  qrDetails?: EmployeeQrDetails | null;
  onAttendanceUpdated: () => void;
}

function extractQrToken(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.token) return parsed.token;
    if (parsed.qr_token) return parsed.qr_token;
  } catch {}
  const match = trimmed.match(/\/attendance\/qr\/([^/?#]+)/);
  if (match) return match[1];
  return trimmed;
}

export const QrAttendanceModal: React.FC<QrAttendanceModalProps> = ({
  open,
  onOpenChange,
  initialTab = 'scan',
  employeeId,
  qrDetails,
  onAttendanceUpdated,
}) => {
  // Stable refs for props & callbacks to prevent re-render loops
  const onAttendanceUpdatedRef = useRef(onAttendanceUpdated);
  useEffect(() => {
    onAttendanceUpdatedRef.current = onAttendanceUpdated;
  }, [onAttendanceUpdated]);

  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  // GPS state (silent background fetch)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const coordsRef = useRef(coords);
  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  // Status state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success Feedback Screen state
  const [successData, setSuccessData] = useState<QrAttendanceSubmitResult | null>(null);
  const [warningData, setWarningData] = useState<{ title: string; message: string } | null>(null);
  const [countdown, setCountdown] = useState<number>(5);

  // Camera & Scanner state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const scanLoopRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Background GPS detection
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    scanLoopRef.current = false;
    isProcessingRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraLoading(false);
  }, []);

  // Auto-close countdown timer after success screen
  useEffect(() => {
    if (!successData || countdown <= 0) return;
    const timer = setTimeout(() => {
      if (countdown === 1) {
        onOpenChangeRef.current(false);
      } else {
        setCountdown((c) => c - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [successData, countdown]);

  // Handle detected QR Token
  const processQrToken = useCallback(
    async (tokenInput: string) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      scanLoopRef.current = false;

      const cleanToken = extractQrToken(tokenInput);
      if (!cleanToken) {
        toast.error('កូដ QR មិនត្រឹមត្រូវទេ');
        isProcessingRef.current = false;
        return;
      }

      setSubmitting(true);
      setErrorMsg(null);
      try {
        const currentCoords = coordsRef.current;
        const lat = currentCoords?.latitude ?? 11.8891000;
        const lng = currentCoords?.longitude ?? 105.8762000;
        const accuracy = currentCoords?.accuracy ?? 10;

        const res: QrAttendanceSubmitResult = await qrAttendanceService.submitAttendance({
          token: cleanToken,
          latitude: lat,
          longitude: lng,
          accuracy,
          device_metadata: navigator.userAgent,
        });

        // 1. Play success chime sound
        sound.playSuccess();

        // 2. Stop camera stream cleanly
        stopCamera();

        // 3. Trigger immediate feedback screen with 5s countdown
        setSuccessData(res);
        setCountdown(5);

        // 4. Notify parent to refresh attendance records
        onAttendanceUpdatedRef.current();

        const actionKh = res?.action === 'check_out' ? 'ចុះវត្តមានចេញ' : 'ចុះវត្តមានចូល';
        toast.success(`បាន${actionKh}ដោយជោគជ័យ!`);
      } catch (err: any) {
        const responseData = err?.response?.data;
        let detailedMsg = '';
        let isDuplicate = false;

        if (responseData?.errors && typeof responseData.errors === 'object') {
          const errorEntries = Object.entries(responseData.errors);
          if (errorEntries.length > 0) {
            const [field, messages] = errorEntries[0];
            const firstMsg = Array.isArray(messages) ? messages[0] : String(messages);

            if (field === 'duplicate') {
              isDuplicate = true;
              detailedMsg = firstMsg;
            } else if (field === 'token') {
              detailedMsg = `កូដ QR មិនត្រឹមត្រូវ ផុតកំណត់ ឬមិនមែនជាកាត QR របស់ប្រព័ន្ធ (${firstMsg})`;
            } else if (field === 'ownership') {
              detailedMsg = `កូដ QR នេះជារបស់បុគ្គលិកផ្សេង (${firstMsg})`;
            } else if (field === 'network') {
              detailedMsg = `បញ្ហាបណ្តាញ Wi-Fi: ${firstMsg}`;
            } else if (field === 'location') {
              detailedMsg = `បញ្ហាទីតាំង GPS: ${firstMsg}`;
            } else {
              detailedMsg = firstMsg;
            }
          }
        }

        if (isDuplicate) {
          sound.playSuccess();
          stopCamera();
          setWarningData({
            title: 'បានកត់ត្រាវត្តមានរួចរាល់ហើយ',
            message: detailedMsg || 'អ្នកបានចុះវត្តមានរួចរាល់ហើយសម្រាប់វេនការងារនេះ',
          });
          return;
        }

        const msg =
          detailedMsg ||
          (responseData?.message && responseData.message !== 'The given data was invalid.'
            ? responseData.message
            : 'កូដ QR មិនត្រឹមត្រូវ ផុតកំណត់ ឬមិនមែនជាកាត QR របស់បុគ្គលិកនេះ');
        setErrorMsg(msg);
        toast.error(msg);

        // Resume scanning loop after short pause
        setTimeout(() => {
          isProcessingRef.current = false;
          if (videoRef.current && streamRef.current) {
            scanLoopRef.current = true;
            runScanLoop();
          }
        }, 2000);
      } finally {
        setSubmitting(false);
      }
    },
    [stopCamera]
  );

  // Throttled scanning loop: decodes only every 250ms to keep CPU near 0%
  const runScanLoop = useCallback(() => {
    if (!scanLoopRef.current || !videoRef.current) return;
    const video = videoRef.current;

    const now = Date.now();
    // Throttle to 4 scans per second (every 250ms) to eliminate freeze / high CPU
    if (now - lastScanTimeRef.current >= 250) {
      lastScanTimeRef.current = now;

      if (
        video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        try {
          let canvas = canvasRef.current;
          if (!canvas) {
            canvas = document.createElement('canvas');
            canvasRef.current = canvas;
          }
          // Downscale to max 480px width for fast decoding
          const scale = Math.min(1, 480 / video.videoWidth);
          const w = Math.floor(video.videoWidth * scale);
          const h = Math.floor(video.videoHeight * scale);

          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }

          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, w, h);
            const imageData = ctx.getImageData(0, 0, w, h);
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (qrCode && qrCode.data) {
              processQrToken(qrCode.data);
              return; // stop scheduling next frame
            }
          }
        } catch {
          // ignore single frame glitch
        }
      }
    }

    if (scanLoopRef.current) {
      animFrameRef.current = requestAnimationFrame(runScanLoop);
    }
  }, [processQrToken]);

  // Start Camera with graceful device fallback
  const startCamera = useCallback(
    async (mode: 'environment' | 'user' = facingMode) => {
      setCameraLoading(true);
      setCameraError(null);
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Use { ideal: mode } so Macs/laptops without rear camera fall back to webcam cleanly
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode === 'user' ? 'user' : { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch {
            // Autoplay permitted
          }
        }

        setCameraActive(true);
        setCameraLoading(false);
        scanLoopRef.current = true;
        isProcessingRef.current = false;
        runScanLoop();
      } catch (err: any) {
        setCameraLoading(false);
        setCameraActive(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('សូមអនុញ្ញាតសិទ្ធិបើក Camera លើ Browser របស់អ្នកដើម្បីស្កេន');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError('រកមិនឃើញកាមេរ៉ាលើឧបករណ៍របស់អ្នកទេ');
        } else {
          setCameraError('មិនអាចបើកកាមេរ៉ាបានទេ: ' + (err.message || 'សូមពិនិត្យកាមេរ៉ា'));
        }
      }
    },
    [facingMode, runScanLoop]
  );

  // Toggle front/back camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Image upload scanning fallback
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await img.decode();

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (code && code.data) {
        processQrToken(code.data);
      } else {
        toast.error('រកមិនឃើញកូដ QR ក្នុងរូបភាពនេះទេ');
      }
    } catch {
      toast.error('មិនអាចអានរូបភាពកូដ QR បានទេ');
    }
  };

  // Lifecycle: only triggered when open or initialTab changes
  useEffect(() => {
    if (open) {
      setErrorMsg(null);
      setSuccessData(null);
      setWarningData(null);
      setCountdown(5);
      detectLocation();

      if (initialTab !== 'card') {
        startCamera(facingMode);
      }
    } else {
      stopCamera();
      setSuccessData(null);
      setWarningData(null);
    }

    return () => {
      stopCamera();
    };
  }, [open, initialTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownloadQr = () => {
    const dataUri = qrDetails?.active_qr?.png_data_uri;
    if (!dataUri) return;
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `QR_${qrDetails?.employee?.employee_code || employeeId || 'employee'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. IF OPENED AS EMPLOYEE QR CARD ONLY
  if (initialTab === 'card') {
    return (
      <GlobalModal
        open={open}
        onOpenChange={onOpenChange}
        title="កាតកូដ QR ផ្ទាល់ខ្លួន"
        description="សម្រាប់បង្ហាញស្កេនវត្តមាននៅ Kiosk ឬម៉ាស៊ីនស្កេនមន្ទីរពេទ្យ"
        icon={<QrCode className="size-5" />}
        iconVariant="teal"
        size="sm"
      >
        <div className="flex flex-col items-center text-center space-y-4 py-2">
          {qrDetails?.active_qr ? (
            <>
              <div className="p-4 bg-white border border-border rounded-2xl shadow-xs">
                {qrDetails.active_qr.png_data_uri ? (
                  <img
                    src={qrDetails.active_qr.png_data_uri}
                    alt="Employee Personal QR Code"
                    className="size-52 object-contain"
                  />
                ) : (
                  <div
                    className="size-52"
                    dangerouslySetInnerHTML={{ __html: qrDetails.active_qr.svg }}
                  />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-foreground">
                  {qrDetails.employee?.full_name}
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{qrDetails.employee?.employee_code}</Badge>
                  {qrDetails.employee?.department && (
                    <span>{qrDetails.employee.department}</span>
                  )}
                </div>
              </div>
              {qrDetails.active_qr.png_data_uri && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadQr}
                  className="w-full"
                >
                  <Download className="size-3.5 mr-1.5" />
                  ទាញយកកាត QR
                </Button>
              )}
            </>
          ) : (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="size-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-foreground">មិនទាន់មានកូដ QR សកម្មទេ</p>
              <p className="text-xs text-muted-foreground">
                សូមទាក់ទងផ្នែកធនធានមនុស្ស (HR) ដើម្បីបង្កើតកាត QR ផ្ទាល់ខ្លួន
              </p>
            </div>
          )}
        </div>
      </GlobalModal>
    );
  }

  // 2. SUCCESS FEEDBACK SCREEN (High-impact visual & audio verification)
  if (successData) {
    const isCheckIn = successData.action === 'check_in';
    const timing = successData.timing_status || 'on_time';
    const timingNote =
      successData.timing_note ||
      (timing === 'late'
        ? `មកយឺត ${successData.late_minutes} នាទី`
        : timing === 'early_leave'
        ? `ចេញមុន ${successData.early_leaving_minutes} នាទី`
        : timing === 'overtime'
        ? `ថែមម៉ោង ${successData.overtime_hours} ម៉ោង`
        : 'ទាន់ម៉ោង');
    const empInfo = successData.employee || qrDetails?.employee;

    return (
      <GlobalModal
        open={open}
        onOpenChange={onOpenChange}
        title={isCheckIn ? 'ចុះវត្តមានចូលជោគជ័យ' : 'ចុះវត្តមានចេញជោគជ័យ'}
        description="ប្រព័ន្ធបានកត់ត្រាវត្តមានរបស់អ្នកដោយជោគជ័យ"
        icon={<CheckCircle2 className="size-5" />}
        iconVariant="teal"
        size="sm"
      >
        <div className="flex flex-col items-center text-center space-y-3.5 py-1">
          {/* Animated Glowing Checkmark Circle */}
          <div className="relative flex items-center justify-center my-1">
            <div className="size-20 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-600 animate-in zoom-in-75 duration-300 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="size-11 stroke-[2.5]" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
            </span>
          </div>

          {/* Action Badge & Employee Info */}
          <div className="space-y-1">
            <Badge
              variant="outline"
              className={`text-xs px-3 py-1 font-semibold ${
                isCheckIn
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
              }`}
            >
              {isCheckIn ? '🟢 ចុះវត្តមានចូល (Check-In)' : '🔵 ចុះវត្តមានចេញ (Check-Out)'}
            </Badge>

            <h3 className="text-lg font-bold text-foreground tracking-tight pt-1">
              {empInfo?.full_name || 'បុគ្គលិក'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {empInfo?.employee_code} • {empInfo?.department || 'មន្ទីរពេទ្យ'}
            </p>
          </div>

          {/* Time & Timing Card */}
          <div className="w-full rounded-2xl border border-border bg-muted/40 p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3.5 text-emerald-600" />
                <span>ម៉ោងកត់ត្រា</span>
              </span>
              <span className="text-sm font-bold text-foreground tabular-nums">
                {successData.time_formatted || successData.time}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-emerald-600" />
                <span>កាលបរិច្ឆេទ</span>
              </span>
              <span className="font-medium text-foreground">
                {successData.date}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border/60">
              <span className="text-muted-foreground">ស្ថានភាពម៉ោង</span>
              <Badge
                variant={
                  timing === 'late'
                    ? 'destructive'
                    : timing === 'early_leave'
                    ? 'secondary'
                    : timing === 'overtime'
                    ? 'default'
                    : 'success'
                }
                className="text-[11px] font-semibold"
              >
                {timingNote}
              </Badge>
            </div>

            {successData.working_hours !== undefined && successData.working_hours > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-border/60">
                <span className="text-muted-foreground">ម៉ោងធ្វើការសរុប</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {successData.working_hours} ម៉ោង
                </span>
              </div>
            )}
          </div>

          {/* Dismiss & Countdown */}
          <div className="w-full space-y-2 pt-1">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              យល់ព្រម ({countdown}s)
            </Button>
            <p className="text-[11px] text-muted-foreground">
              ផ្ទាំងនេះនឹងបិទដោយស្វ័យប្រវត្តិក្នុ​ង {countdown} វិនាទី
            </p>
          </div>
        </div>
      </GlobalModal>
    );
  }

  // 3. DUPLICATE PUNCH WARNING SCREEN
  if (warningData) {
    return (
      <GlobalModal
        open={open}
        onOpenChange={onOpenChange}
        title={warningData.title}
        description="ព័ត៌មានស្ថានភាពវត្តមានប្រចាំថ្ងៃ"
        icon={<Clock className="size-5" />}
        iconVariant="amber"
        size="sm"
      >
        <div className="flex flex-col items-center text-center space-y-4 py-2">
          <div className="size-16 rounded-full bg-amber-100 dark:bg-amber-950/80 border-2 border-amber-500/40 flex items-center justify-center text-amber-600 animate-in zoom-in-75 duration-300">
            <Clock className="size-8 stroke-[2.5]" />
          </div>

          <div className="space-y-1.5">
            <Badge
              variant="outline"
              className="text-xs px-3 py-1 font-semibold bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
            >
              🟡 បានកត់ត្រារួចរាល់ (Already Recorded)
            </Badge>
            <p className="text-sm font-medium text-foreground pt-2 max-w-xs mx-auto leading-relaxed">
              {warningData.message}
            </p>
          </div>

          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold mt-2"
          >
            យល់ព្រម (OK)
          </Button>
        </div>
      </GlobalModal>
    );
  }

  // 4. DEFAULT: CAMERA SCANNER MODAL
  return (
    <GlobalModal
      open={open}
      onOpenChange={(val) => {
        if (!val) stopCamera();
        onOpenChange(val);
      }}
      title="ស្កេនវត្តមាន"
      description="សូមដាក់កូដ QR ឱ្យចំកណ្តាលស៊ុមដើម្បីកត់ត្រាវត្តមាន"
      icon={<Camera className="size-5" />}
      iconVariant="teal"
      size="sm"
    >
      <div className="space-y-3 py-1">
        {/* Viewfinder Box */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-square w-full max-w-[320px] mx-auto flex items-center justify-center border-2 border-emerald-500/40 shadow-inner group">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              cameraActive ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Active Scanner Viewfinder Overlay */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="relative size-48 border-2 border-emerald-400 rounded-2xl shadow-[0_0_25px_rgba(52,211,153,0.35)]">
                {/* Corner Accent Markers */}
                <div className="absolute -top-1 -left-1 size-5 border-t-3 border-l-3 border-emerald-300 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 size-5 border-t-3 border-r-3 border-emerald-300 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 size-5 border-b-3 border-l-3 border-emerald-300 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 size-5 border-b-3 border-r-3 border-emerald-300 rounded-br-lg" />

                {/* Animated Laser Scanline */}
                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#34d399] animate-bounce" />
              </div>

              <span className="mt-4 bg-black/75 backdrop-blur-md text-emerald-300 text-xs font-medium px-3 py-1 rounded-full border border-emerald-500/30">
                កំពុងស្កេន...
              </span>
            </div>
          )}

          {/* Camera Inactive / Loading / Error State */}
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-slate-900/95 space-y-3">
              {cameraLoading ? (
                <>
                  <Loader2 className="size-10 text-emerald-400 animate-spin" />
                  <p className="text-sm font-semibold text-slate-200">កំពុងបើកដំណើរការកាមេរ៉ា...</p>
                  <p className="text-xs text-slate-400">សូមរង់ចាំបន្តិច</p>
                </>
              ) : (
                <>
                  <div className="size-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <CameraOff className="size-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-200">កាមេរ៉ាមិនទាន់ដំណើរការទេ</p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    {cameraError || 'សូមចុចប៊ូតុងខាងក្រោមដើម្បីបើកកាមេរ៉ាស្កេនវត្តមាន'}
                  </p>
                  <Button
                    type="button"
                    onClick={() => startCamera()}
                    size="sm"
                    className="mt-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    <Camera className="size-4 mr-1.5" />
                    បើកកាមេរ៉ាស្កេន
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Camera Flip Button */}
          {cameraActive && (
            <div className="absolute top-3 right-3">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={toggleFacingMode}
                className="size-8 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20"
                title="ប្តូរកាមេរ៉ាមុខ / ក្រោយ"
              >
                <FlipHorizontal className="size-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Submitting indicator */}
        {submitting && (
          <div className="flex items-center justify-center gap-2 py-1 text-xs text-emerald-600 font-medium">
            <Loader2 className="size-4 animate-spin" />
            <span>កំពុងកត់ត្រាវត្តមានតាមកូដ QR...</span>
          </div>
        )}

        {/* Status Alerts */}
        {errorMsg && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
          </Alert>
        )}

        {/* Fallback image upload */}
        <div className="pt-1 flex items-center justify-center">
          <label className="text-xs text-muted-foreground hover:text-emerald-600 cursor-pointer flex items-center gap-1.5 transition-colors">
            <Upload className="size-3.5" />
            <span>ស្កេនពីរូបភាពកូដ QR</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>
      </div>
    </GlobalModal>
  );
};
