import * as faceapi from "face-api.js";
import { parseFaceDescriptor } from "@/lib/helper/face-descriptor";

const CACHE_PREFIX = "hr_face_descriptor_v1:";
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const memoryCache = new Map<string, Float32Array>();
const pendingLoads = new Map<string, Promise<Float32Array | null>>();

type CachedDescriptor = {
  descriptor: number[];
  expiresAt: number;
};

function getStorageKey(imageUrl: string) {
  return `${CACHE_PREFIX}${imageUrl}`;
}

export function getCachedFaceDescriptor(imageUrl: string) {
  const memoryDescriptor = memoryCache.get(imageUrl);
  if (memoryDescriptor) return memoryDescriptor;
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(getStorageKey(imageUrl));
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedDescriptor;
    if (!cached.expiresAt || cached.expiresAt <= Date.now()) {
      localStorage.removeItem(getStorageKey(imageUrl));
      return null;
    }
    const parsed = parseFaceDescriptor(cached.descriptor);
    if (!parsed) {
      localStorage.removeItem(getStorageKey(imageUrl));
      return null;
    }
    const descriptor = new Float32Array(parsed);
    memoryCache.set(imageUrl, descriptor);
    return descriptor;
  } catch {
    return null;
  }
}

export function cacheFaceDescriptor(imageUrl: string, descriptor: Float32Array) {
  memoryCache.set(imageUrl, descriptor);
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      getStorageKey(imageUrl),
      JSON.stringify({
        descriptor: Array.from(descriptor),
        expiresAt: Date.now() + CACHE_TTL_MS,
      } satisfies CachedDescriptor),
    );
  } catch {
    // Memory cache remains available when browser storage is unavailable or full.
  }
}

export function loadAndCacheFaceDescriptor(imageUrl: string) {
  const cached = getCachedFaceDescriptor(imageUrl);
  if (cached) return Promise.resolve(cached);

  const pending = pendingLoads.get(imageUrl);
  if (pending) return pending;

  const loadPromise = (async () => {
    try {
      const image = await faceapi.fetchImage(imageUrl);
      const detection = await faceapi
        .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detection) return null;
      cacheFaceDescriptor(imageUrl, detection.descriptor);
      return detection.descriptor;
    } catch {
      return null;
    } finally {
      pendingLoads.delete(imageUrl);
    }
  })();

  pendingLoads.set(imageUrl, loadPromise);
  return loadPromise;
}
