"use client";

import { useRef, useState, useCallback } from "react";
import { Camera, RefreshCw, CheckCircle, X, ScanFace } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FaceCaptureProps {
  value: string | null; // base64 data URL or existing avatarUrl
  onChange: (dataUrl: string | null) => void;
}

type CaptureState = "idle" | "camera" | "captured";

export default function FaceCapture({ value, onChange }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<CaptureState>(value ? "captured" : "idle");
  const [cameraError, setCameraError] = useState("");

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = async () => {
    setCameraError("");
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

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    stopCamera();
    onChange(dataUrl);
    setState("captured");
  };

  const retake = () => {
    onChange(null);
    setState("idle");
    stopCamera();
  };

  const displayImage = value;

  return (
    <div className="space-y-2">
      {/* Captured / Preview state */}
      {state === "captured" && displayImage && (
        <div className="relative w-full flex flex-col items-center gap-3">
          <div className="relative">
            <img
              src={displayImage}
              alt="Foto wajah"
              className="w-40 h-40 rounded-full object-cover border-4 border-green-500 shadow-lg"
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
          <Button
            type="button"
            variant="outline"
            onClick={startCamera}
            className="flex items-center gap-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
          >
            <Camera className="w-4 h-4" />
            Buka Kamera
          </Button>
        </div>
      )}
    </div>
  );
}
