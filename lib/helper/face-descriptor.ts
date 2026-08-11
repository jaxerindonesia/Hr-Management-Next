export const FACE_DESCRIPTOR_LENGTH = 128;

export function parseFaceDescriptor(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length !== FACE_DESCRIPTOR_LENGTH) return null;

  const descriptor = value.map(Number);
  if (descriptor.some((entry) => !Number.isFinite(entry) || Math.abs(entry) > 10)) {
    return null;
  }

  return descriptor;
}
