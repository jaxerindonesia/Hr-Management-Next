type JwtPayload = {
  sub?: string;
  role?: string;
  exp?: number;
  iat?: number;
};

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

async function verifyHs256Signature(
  headerPayload: string,
  signature: string,
  secret: string,
) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  return crypto.subtle.verify(
    "HMAC",
    key,
    decodeBase64Url(signature),
    encoder.encode(headerPayload),
  );
}

export async function verifyEdgeSessionToken(token: string, secret: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;

  try {
    const verified = await verifyHs256Signature(
      `${encodedHeader}.${encodedPayload}`,
      signature,
      secret,
    );
    if (!verified) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(encodedPayload)),
    ) as JwtPayload;

    if (!payload?.sub) return null;
    if (payload.exp && payload.exp * 1000 <= Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}
