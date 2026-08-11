type FacePerformanceEvent = {
  event: "ready" | "match" | "failure";
  mode: "check-in" | "check-out" | "break-in" | "break-out";
  descriptorSource?: "database" | "cache" | "image";
  totalMs: number;
  referenceMs?: number;
  cameraMs?: number;
  reason?: string;
};

export function reportFacePerformance(metric: FacePerformanceEvent) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify(metric);
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/face-recognition/metrics",
      new Blob([body], { type: "application/json" }),
    );
    return;
  }

  void fetch("/api/face-recognition/metrics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}
