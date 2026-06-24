"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, RefreshCw, CheckCircle, X, ScanFace, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as faceapi from "face-api.js";
import { ensureFaceModelLoaded } from "@/lib/helper/face-models";

interface FaceCaptureProps {
  value: string | null; // base64 data URL or existing avatarUrl
  onChange: (dataUrl: string | null) => void;
}

type CaptureState = "idle" | "camera" | "validating" | "captured" | "invalid";

export default function FaceCapture({ value, onChange }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<CaptureState>(value ? "captured" : "idle");
  const [cameraError, setCameraError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [accessoryConfirmed, setAccessoryConfirmed] = useState(false);

  // Load face-api models once
  useEffect(() => {
    const load = async () => {
      try {
        await ensureFaceModelLoaded("face-capture", [
          () => faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          () => faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        ]);
        setModelsLoaded(true);
      } catch {
        // models gagal load, tapi tetap bisa capture tanpa validasi
        setModelsLoaded(false);
      }
    };
    load();
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = async () => {
    setCameraError("");
    setValidationError("");
    setState("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError("Kamera tidak dapat diakses. Pastikan izin kamera diberikan.");
      setState("idle");
    }
  };

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    if (!accessoryConfirmed) {
      setValidationError("Lepas kacamata dan topi terlebih dahulu sebelum mengambil foto.");
      setState("invalid");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    stopCamera();

    // Jika model belum siap, langsung simpan tanpa validasi
    if (!modelsLoaded) {
      onChange(dataUrl);
      setState("captured");
      return;
    }

    // Validasi wajah di foto
    setState("validating");
    setValidationError("");
    try {
      const img = await faceapi.fetchImage(dataUrl);
      const detections = await faceapi
        .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
        .withFaceLandmarks();

      if (detections.length === 0) {
        setValidationError("Tidak ada wajah terdeteksi di foto. Pastikan wajah terlihat jelas, pencahayaan cukup, dan tidak tertutup masker/topi.");
        setState("invalid");
        return;
      }

      if (detections.length > 1) {
        setValidationError("Terdeteksi lebih dari satu wajah. Pastikan hanya ada satu orang di depan kamera.");
        setState("invalid");
        return;
      }

      // Validasi lulus — simpan foto
      onChange(dataUrl);
      setState("captured");
    } catch {
      // Jika ada error saat validasi, tetap simpan foto
      onChange(dataUrl);
      setState("captured");
    }
  };

  const retake = () => {
    onChange(null);
    setValidationError("");
    setAccessoryConfirmed(false);
    stopCamera();
    setState("idle");
  };

  const retakeAndReopen = () => {
    onChange(null);
    setValidationError("");
    setAccessoryConfirmed(false);
    stopCamera();
    setState("idle");
    setTimeout(() => { void startCamera(); }, 50);
  };

  const displayImage = value;

  return (
    <div className="space-y-2">
      {/* Captured / Preview state */}
      {state === "captured" && displayImage && (
        <div className="relative w-full flex flex-col items-center gap-3">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImage}
              alt="Foto wajah"
              className="w-40 h-40 rounded-full object-cover border-4 border-green-500 shadow-lg"
              onError={(e) => {
                // Jika gambar gagal dimuat, tampilkan placeholder
                const target = e.currentTarget;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent && !parent.querySelector(".face-placeholder")) {
                  const placeholder = document.createElement("div");
                  placeholder.className = "face-placeholder w-40 h-40 rounded-full border-4 border-yellow-400 bg-gray-100 dark:bg-gray-700 flex items-center justify-center";
                  placeholder.innerHTML = `<span class="text-xs text-gray-500 text-center px-2">Foto tidak dapat dimuat</span>`;
                  parent.insertBefore(placeholder, target);
                }
              }}
            />
            <div className="absolute bottom-1 right-1 bg-green-500 rounded-full p-1">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Foto wajah berhasil diambil
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={retake}
            className="flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Ambil Ulang
          </Button>
        </div>
      )}

      {/* Camera state */}
      {state === "camera" && (
        <div className="flex flex-col items-center gap-3">
          <div className="relative rounded-xl overflow-hidden border-2 border-indigo-400 bg-black w-full max-w-xs aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
            {/* Face guide oval */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-28 h-36 rounded-full border-4 border-indigo-400 opacity-70"
                style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)" }}
              />
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Posisikan wajah di dalam lingkaran, lalu klik Ambil Foto
          </p>
          <label className="flex items-start gap-2 max-w-xs text-xs text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={accessoryConfirmed}
              onChange={(e) => setAccessoryConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-indigo-600"
            />
            <span>Saya sudah melepas kacamata dan topi.</span>
          </label>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={capture}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Ambil Foto
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                stopCamera();
                setState("idle");
              }}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Batal
            </Button>
          </div>
        </div>
      )}

      {/* Validating state */}
      {state === "validating" && (
        <div className="flex flex-col items-center gap-3 py-6 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <div className="text-center">
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Memvalidasi wajah...
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Mendeteksi wajah pada foto yang diambil
            </p>
          </div>
        </div>
      )}

      {/* Invalid face state */}
      {state === "invalid" && (
        <div className="flex flex-col items-center gap-3 py-4 border-2 border-dashed border-red-300 dark:border-red-700 rounded-xl">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              Foto Tidak Valid
            </p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
              {validationError}
            </p>
          </div>
          {/* Tampilkan ulang checklist agar user ingat syaratnya */}
          <label className="flex items-start gap-2 max-w-xs text-xs text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={accessoryConfirmed}
              onChange={(e) => setAccessoryConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-indigo-600"
            />
            <span>Saya sudah melepas kacamata dan topi.</span>
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={retakeAndReopen}
            className="flex items-center gap-2 border-red-400 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <RefreshCw className="w-4 h-4" />
            Ambil Ulang
          </Button>
        </div>
      )}

      {/* Idle state */}
      {state === "idle" && (
        <div className="flex flex-col items-center gap-3 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <ScanFace className="w-8 h-8 text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Foto Wajah Karyawan
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Digunakan untuk verifikasi absensi
            </p>
          </div>
          {cameraError && (
            <p className="text-xs text-red-500 text-center px-4">{cameraError}</p>
          )}
          {/* Checklist wajib sebelum buka kamera */}
          <label className="flex items-start gap-2 max-w-xs text-xs text-gray-600 dark:text-gray-300 cursor-pointer px-2">
            <input
              type="checkbox"
              checked={accessoryConfirmed}
              onChange={(e) => setAccessoryConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-indigo-600 cursor-pointer"
            />
            <span>Saya sudah melepas kacamata dan topi.</span>
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={startCamera}
            disabled={!accessoryConfirmed}
            className="flex items-center gap-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-indigo-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Camera className="w-4 h-4" />
            Buka Kamera
          </Button>
        </div>
      )}
    </div>
  );
}
