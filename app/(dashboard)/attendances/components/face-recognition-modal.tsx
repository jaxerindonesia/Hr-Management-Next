"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";
import { X, Camera, CheckCircle, XCircle, Loader2, ScanFace } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FaceRecognitionModalProps {
  isOpen: boolean;
  mode: "check-in" | "check-out";
  referenceImageUrl: string | null;
  onSuccess: () => void;
  onSkip: () => void;
  onClose: () => void;
}

type ScanStatus =
  | "loading-models"
  | "loading-reference"
  | "scanning"
  | "mouth-open-required"
  | "glasses-detected"
  | "hat-detected"
  | "match"
  | "no-match"
  | "no-face"
  | "no-reference"
  | "error"
  | "no-camera";

export default function FaceRecognitionModal({
  isOpen,
  mode,
  referenceImageUrl,
  onSuccess,
  onSkip,
  onClose,
}: FaceRecognitionModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const referenceDescriptorRef = useRef<Float32Array | null>(null);
  const successCalledRef = useRef(false);

  // Mouth detection state
  const mouthOpenFramesRef = useRef(0);
  const mouthOpenRef = useRef(false); // ref untuk dicek dalam loop (hindari stale closure)
  const [status, setStatus] = useState<ScanStatus>("loading-models");
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isMouthOpen, setIsMouthOpen] = useState(false);

  const stopCamera = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    stopCamera();
    successCalledRef.current = false;
    referenceDescriptorRef.current = null;
    mouthOpenRef.current = false;
    setIsMouthOpen(false);
    mouthOpenFramesRef.current = 0;
    setStatus("loading-models");
    setMatchScore(null);
  }, [stopCamera]);

  // Load models once
  useEffect(() => {
    if (modelsLoaded) return;
    const load = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setModelsLoaded(true);
      } catch {
        setStatus("error");
      }
    };
    load();
  }, [modelsLoaded]);

  // Main flow when modal opens
  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    if (!modelsLoaded) {
      setStatus("loading-models");
      return;
    }

    let cancelled = false;

    const run = async () => {
      // ── 1. Load reference face ──────────────────────────────────────────
      if (!referenceImageUrl) {
        setStatus("scanning"); // no reference → still open camera, skip match later
      } else {
        setStatus("loading-reference");
        try {
          const img = await faceapi.fetchImage(referenceImageUrl);
          const detection = await faceapi
            .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (!detection) {
            // Foto referensi tidak terdeteksi wajahnya → BLOKIR, jangan auto-pass
            referenceDescriptorRef.current = null;
          } else {
            referenceDescriptorRef.current = detection.descriptor;
          }
        } catch {
          referenceDescriptorRef.current = null;
        }
      }

      if (cancelled) return;

      // Jika tidak ada referenceImageUrl atau gagal detect wajah dari foto referensi
      // → tampilkan status "no-reference", JANGAN lanjut ke kamera
      if (!referenceImageUrl) {
        setStatus("no-reference");
        return;
      }

      // Jika referenceImageUrl ada tapi wajahnya tidak terdeteksi di foto
      if (!referenceDescriptorRef.current) {
        setStatus("no-reference");
        return;
      }

      // ── 2. Start Camera ─────────────────────────────────────────────────
      setStatus("scanning");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        if (!cancelled) setStatus("no-camera");
        return;
      }

      // ── 3. Real-time scan loop ───────────────────────────────────────────
      const detectFrame = async () => {
        if (!videoRef.current || cancelled || successCalledRef.current) return;

        const detection = await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 }),
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

        // Draw overlay
        if (canvasRef.current && videoRef.current) {
          const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
          const ctx = canvasRef.current.getContext("2d");
          ctx?.clearRect(0, 0, dims.width, dims.height);
          if (detection) {
            const resized = faceapi.resizeResults(detection, dims);
            faceapi.draw.drawDetections(canvasRef.current, [resized]);
            faceapi.draw.drawFaceLandmarks(canvasRef.current, [resized]);
          }
        }

        if (!detection) {
          if (!cancelled) setStatus("no-face");
          timeoutRef.current = setTimeout(detectFrame, 200);
          return;
        }

        const landmarks = detection.landmarks;
        const mouth = landmarks.getMouth();

        // Helper function for MAR (Mouth Aspect Ratio)
        const getMAR = (m: faceapi.Point[]) => {
          // Vertical: jarak antara titik tengah bibir atas (13) dan bawah (19)
          // Horizontal: jarak antara sudut mulut kiri (0) dan kanan (6)
          const A = Math.sqrt(Math.pow(m[13].x - m[19].x, 2) + Math.pow(m[13].y - m[19].y, 2));
          const B = Math.sqrt(Math.pow(m[14].x - m[18].x, 2) + Math.pow(m[14].y - m[18].y, 2));
          const C = Math.sqrt(Math.pow(m[12].x - m[16].x, 2) + Math.pow(m[12].y - m[16].y, 2));
          const horizontal = Math.sqrt(Math.pow(m[0].x - m[6].x, 2) + Math.pow(m[0].y - m[6].y, 2));
          return (A + B + C) / (2.0 * Math.max(horizontal, 1));
        };

        const mar = getMAR(mouth);

        // Mouth open detection - threshold 0.25 (cukup sensitif)
        if (mar > 0.25) {
          mouthOpenFramesRef.current += 1;
          if (mouthOpenFramesRef.current >= 3) {
            mouthOpenRef.current = true; // update ref untuk deteksi di loop
            setIsMouthOpen(true); // update state untuk UI
          }
        } else if (mar < 0.15) {
          // Jangan reset ref jika sudah pernah buka mulut (agar tidak perlu buka ulang)
          if (!mouthOpenRef.current) {
            mouthOpenFramesRef.current = Math.max(0, mouthOpenFramesRef.current - 1);
          }
        }

        // ── 4. Checks (Glasses & Hat Heuristics) ─────────────────────────────
        const topOfFace = detection.detection.box.top;
        const eyebrows = landmarks.getLeftEyeBrow();
        const eyebrowTop = eyebrows[2].y;
        const foreheadHeight = eyebrowTop - topOfFace;

        if (foreheadHeight < 12) {
          if (!cancelled) setStatus("hat-detected");
          timeoutRef.current = setTimeout(detectFrame, 200);
          return;
        }

        // ── 5. Match ────────────────────────────────────────────────────────
        if (!referenceDescriptorRef.current) {
          if (!cancelled) setStatus("no-reference");
          timeoutRef.current = setTimeout(detectFrame, 200);
          return;
        }

        const distance = faceapi.euclideanDistance(
          detection.descriptor,
          referenceDescriptorRef.current,
        );
        const score = Math.max(0, 1 - distance);
        setMatchScore(score);

        if (distance <= 0.45) {
          // Cek mouthOpenRef (bukan state) agar tidak terkena stale closure
          if (!mouthOpenRef.current) {
            if (!cancelled) setStatus("mouth-open-required");
            timeoutRef.current = setTimeout(detectFrame, 200);
            return;
          }
          
          if (!cancelled && !successCalledRef.current) {
            successCalledRef.current = true;
            setStatus("match");
            stopCamera();
            setTimeout(() => onSuccess(), 1200);
          }
        } else {
          if (!cancelled) setStatus("no-match");
          timeoutRef.current = setTimeout(detectFrame, 200);
        }
      };

      detectFrame();
    };

    run();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [isOpen, modelsLoaded, referenceImageUrl, onSuccess, stopCamera, cleanup]);

  if (!isOpen) return null;

  const statusConfig: Record<
    ScanStatus,
    { label: string; color: string; icon: React.ReactNode }
  > = {
    "loading-models": {
      label: "Memuat model AI...",
      color: "text-blue-400",
      icon: <Loader2 className="w-5 h-5 animate-spin" />,
    },
    "loading-reference": {
      label: "Memuat foto referensi...",
      color: "text-blue-400",
      icon: <Loader2 className="w-5 h-5 animate-spin" />,
    },
    scanning: {
      label: "Mendeteksi wajah...",
      color: "text-yellow-400",
      icon: <ScanFace className="w-5 h-5 animate-pulse" />,
    },
    "mouth-open-required": {
      label: "Wajah dikenali! Silakan BUKA MULUT Anda sekarang",
      color: "text-indigo-400",
      icon: <ScanFace className="w-5 h-5 animate-bounce" />,
    },
    "hat-detected": {
      label: "Topi terdeteksi! Harap lepas topi Anda",
      color: "text-red-400",
      icon: <XCircle className="w-5 h-5" />,
    },
    "glasses-detected": {
      label: "Kacamata terdeteksi! Harap lepas kacamata Anda",
      color: "text-red-400",
      icon: <XCircle className="w-5 h-5" />,
    },
    "no-face": {
      label: "Wajah tidak terdeteksi, posisikan wajah Anda",
      color: "text-orange-400",
      icon: <Camera className="w-5 h-5" />,
    },
    "no-reference": {
      label: "Foto referensi tidak ada — hubungi admin untuk mendaftarkan wajah",
      color: "text-red-400",
      icon: <XCircle className="w-5 h-5" />,
    },
    "no-match": {
      label: "Wajah tidak cocok, coba lagi",
      color: "text-red-400",
      icon: <XCircle className="w-5 h-5" />,
    },
    match: {
      label: "Wajah cocok! ✅",
      color: "text-green-400",
      icon: <CheckCircle className="w-5 h-5" />,
    },
    error: {
      label: "Gagal memuat model AI",
      color: "text-red-400",
      icon: <XCircle className="w-5 h-5" />,
    },
    "no-camera": {
      label: "Kamera tidak tersedia",
      color: "text-red-400",
      icon: <XCircle className="w-5 h-5" />,
    },
  };

  const cfg = statusConfig[status];
  const modeLabel = mode === "check-in" ? "Check In" : "Check Out";
  const showSkip =
    status === "no-camera" ||
    status === "error" ||
    status === "no-reference" ||
    status === "no-match";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6">
      <div className="relative bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-[95%] sm:max-w-md md:max-w-lg overflow-hidden transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <ScanFace className="w-5 h-5 text-indigo-400" />
            <h2 className="text-white font-semibold text-sm sm:text-base">
              Verifikasi Wajah – {modeLabel}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera area */}
        <div className="relative bg-black aspect-[4/3] sm:aspect-video overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />

          {/* Face frame guide */}
          {(status === "scanning" || status === "no-face" || status === "no-match" || status === "mouth-open-required") && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`w-40 h-52 sm:w-48 sm:h-60 rounded-full border-4 transition-colors duration-500 ${
                  status === "no-match"
                    ? "border-red-400"
                    : status === "no-face"
                      ? "border-orange-400 opacity-60"
                      : status === "mouth-open-required"
                        ? "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]"
                        : "border-indigo-400 opacity-70"
                }`}
                style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)" }}
              />
              {status === "mouth-open-required" && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                   <div className="bg-indigo-600 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-bold animate-pulse shadow-lg whitespace-nowrap">
                      SILAKAN BUKA MULUT
                   </div>
                </div>
              )}
            </div>
          )}

          {/* Match overlay */}
          {status === "match" && (
            <div className="absolute inset-0 flex items-center justify-center bg-green-900/60">
              <CheckCircle className="w-20 h-20 text-green-400 drop-shadow-lg" />
            </div>
          )}

          {/* Loading overlay */}
          {(status === "loading-models" || status === "loading-reference") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 gap-3">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
              <p className="text-gray-300 text-sm">{cfg.label}</p>
            </div>
          )}

          {/* No camera overlay */}
          {(status === "no-camera" || status === "error") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 gap-3">
              <Camera className="w-12 h-12 text-gray-500" />
              <p className="text-gray-400 text-sm text-center px-6">{cfg.label}</p>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="px-4 sm:px-5 py-2 sm:py-3 bg-gray-800/60 border-t border-gray-700">
          <div className={`flex items-center gap-2 ${cfg.color}`}>
            {cfg.icon}
            <span className="text-xs sm:text-sm font-medium line-clamp-1">{cfg.label}</span>
            {matchScore !== null && status === "no-match" && (
              <span className="ml-auto text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">
                Sim: {(matchScore * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
          {showSkip && (
            <Button
              variant="outline"
              className="w-full sm:flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white text-xs sm:text-sm h-9 sm:h-10"
              onClick={onSkip}
            >
              Lewati Scan Wajah
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full sm:flex-1 text-gray-400 hover:text-white hover:bg-gray-700 text-xs sm:text-sm h-9 sm:h-10"
            onClick={onClose}
          >
            Batal
          </Button>
        </div>

        {/* Hint */}
        <p className="text-center text-[10px] sm:text-xs text-gray-500 pb-3 sm:pb-4 px-4 sm:px-5">
          Pastikan wajah terlihat jelas dan pencahayaan cukup
        </p>
      </div>
    </div>
  );
}