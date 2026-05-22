const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEY_LENGTH = 256;
const PBKDF2_HASH = "SHA-256";

export interface AdminJwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64"));
  }
  const binary = atob(value);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function toBase64Url(input: string): string {
  return input.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return normalized + padding;
}

function encodeJsonBase64Url(value: unknown): string {
  const raw = new TextEncoder().encode(JSON.stringify(value));
  return toBase64Url(bytesToBase64(raw));
}

function decodeJsonBase64Url<T>(value: string): T {
  const bytes = base64ToBytes(fromBase64Url(value));
  const text = new TextDecoder().decode(bytes);
  return JSON.parse(text) as T;
}

async function hmacSign(input: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
  return toBase64Url(bytesToBase64(new Uint8Array(signature)));
}

function safeStringCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export async function createJwt(payload: AdminJwtPayload, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = encodeJsonBase64Url(header);
  const encodedPayload = encodeJsonBase64Url(payload);
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = await hmacSign(unsignedToken, secret);
  return `${unsignedToken}.${signature}`;
}

export async function verifyJwt(token: string, secret: string): Promise<AdminJwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, signature] = parts;

  const expectedSig = await hmacSign(`${encodedHeader}.${encodedPayload}`, secret);
  if (!safeStringCompare(signature, expectedSig)) return null;

  const header = decodeJsonBase64Url<{ alg?: string; typ?: string }>(encodedHeader);
  if (header.alg !== "HS256" || header.typ !== "JWT") return null;

  const payload = decodeJsonBase64Url<AdminJwtPayload>(encodedPayload);
  if (!payload?.sub || !payload?.email || !payload?.role || !payload?.exp) return null;

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) return null;

  return payload;
}

export async function hashPassword(password: string, saltHex?: string): Promise<string> {
  const salt = saltHex
    ? Uint8Array.from(saltHex.match(/.{1,2}/g)!.map((v) => Number.parseInt(v, 16)))
    : crypto.getRandomValues(new Uint8Array(16));

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    key,
    PBKDF2_KEY_LENGTH,
  );

  const hashBase64 = bytesToBase64(new Uint8Array(derived));
  const saltHexValue = Array.from(salt, (b) => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2$sha256$${PBKDF2_ITERATIONS}$${saltHexValue}$${hashBase64}`;
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const parts = encodedHash.split("$");
  if (parts.length !== 5) return false;
  const [scheme, hashAlg, iterationsRaw, saltHex, hashValue] = parts;
  if (scheme !== "pbkdf2" || hashAlg !== "sha256") return false;
  const iterations = Number.parseInt(iterationsRaw, 10);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;

  const salt = Uint8Array.from(saltHex.match(/.{1,2}/g)?.map((v) => Number.parseInt(v, 16)) ?? []);
  if (salt.length === 0) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    key,
    PBKDF2_KEY_LENGTH,
  );

  const computed = bytesToBase64(new Uint8Array(derived));
  return safeStringCompare(computed, hashValue);
}
