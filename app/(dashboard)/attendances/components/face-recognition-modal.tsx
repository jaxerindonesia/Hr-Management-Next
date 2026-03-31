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
  | "blink-required"
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const referenceDescriptorRef = useRef<Float32Array | null>(null);
  const successCalledRef = useRef(false);

  // Blink detection states
  const blinkCountRef = useRef(0);
  const wasMataTertutupRef = useRef(false);

  const [status, setStatus] = useState<ScanStatus>("loading-models");
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [hasBlinked, setHasBlinked] = useState(false);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
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
    blinkCountRef.current = 0;
    wasMataTertutupRef.current = false;
    setHasBlinked(false);
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
      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || cancelled || successCalledRef.current) return;

        const detection = await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }),
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
          return;
        }

        const landmarks = detection.landmarks;
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        // Helper function for EAR
        const getEAR = (eye: faceapi.Point[]) => {
          const v1 = Math.sqrt(Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2));
          const v2 = Math.sqrt(Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2));
          const h = Math.sqrt(Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2));
          return (v1 + v2) / (2 * h);
        };

        const ear = (getEAR(leftEye) + getEAR(rightEye)) / 2;

        // Blink detection logic (EAR threshold ~0.2)
        if (ear < 0.22) {
          wasMataTertutupRef.current = true;
        } else if (wasMataTertutupRef.current && ear > 0.25) {
          wasMataTertutupRef.current = false;
          blinkCountRef.current += 1;
          if (blinkCountRef.current >= 1) {
            setHasBlinked(true);
          }
        }

        // ── 4. Checks (Glasses & Hat Heuristics) ─────────────────────────────
        // Deteksi Kacamata (Heuristik: Cek area antara mata dan hidung)
        // Kita gunakan area bridge hidung dan jarak antar mata
        const noseBridge = landmarks.getNose();
        const eyeDistance = Math.abs(leftEye[3].x - rightEye[0].x);
        
        // Deteksi Topi (Heuristik: Jarak antara alis dan atas wajah)
        const jawOutline = landmarks.getJawOutline();
        const topOfFace = detection.detection.box.top;
        const eyebrows = landmarks.getLeftEyeBrow();
        const eyebrowTop = eyebrows[2].y;
        const foreheadHeight = eyebrowTop - topOfFace;

        if (foreheadHeight < 15) {
          if (!cancelled) setStatus("hat-detected");
          return;
        }

        // ── 5. Match ────────────────────────────────────────────────────────
        if (!referenceDescriptorRef.current) {
          if (!cancelled) setStatus("no-reference");
          return;
        }

        const distance = faceapi.euclideanDistance(
          detection.descriptor,
          referenceDescriptorRef.current,
        );
        const score = Math.max(0, 1 - distance);
        setMatchScore(score);

        if (distance <= 0.45) {
          if (!hasBlinked) {
            if (!cancelled) setStatus("blink-required");
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
        }
      }, 400);
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
    "blink-required": {
      label: "Wajah dikenali! Silakan KEDIPKAN mata Anda sekarang",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <ScanFace className="w-5 h-5 text-indigo-400" />
            <h2 className="text-white font-semibold text-base">
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
        <div className="relative bg-black aspect-video overflow-hidden">
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
          {(status === "scanning" || status === "no-face" || status === "no-match" || status === "blink-required") && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`w-48 h-60 rounded-full border-4 transition-colors duration-500 ${
                  status === "no-match"
                    ? "border-red-400"
                    : status === "no-face"
                      ? "border-orange-400 opacity-60"
                      : status === "blink-required"
                        ? "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]"
                        : "border-indigo-400 opacity-70"
                }`}
                style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)" }}
              />
              {status === "blink-required" && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                   <div className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse shadow-lg">
                      SILAKAN KEDIP
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
        <div className="px-5 py-3 bg-gray-800/60 border-t border-gray-700">
          <div className={`flex items-center gap-2 ${cfg.color}`}>
            {cfg.icon}
            <span className="text-sm font-medium">{cfg.label}</span>
            {matchScore !== null && status === "no-match" && (
              <span className="ml-auto text-xs text-gray-400">
                Similarity: {(matchScore * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 flex gap-3">
          {showSkip && (
            <Button
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={onSkip}
            >
              Lewati Scan Wajah
            </Button>
          )}
          <Button
            variant="ghost"
            className="flex-1 text-gray-400 hover:text-white hover:bg-gray-700"
            onClick={onClose}
          >
            Batal
          </Button>
        </div>

        {/* Hint */}
        <p className="text-center text-xs text-gray-500 pb-4 px-5">
          Pastikan wajah Anda terlihat jelas dan pencahayaan cukup
        </p>
      </div>
    </div>
  );
}