import { env } from "cloudflare:workers";

export interface D1RunResult {
  success: boolean;
  meta?: Record<string, unknown>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<D1RunResult>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatement;
}

export interface R2PutOptionsLike {
  httpMetadata?: {
    contentType?: string;
    cacheControl?: string;
  };
}

export interface R2BucketLike {
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob,
    options?: R2PutOptionsLike,
  ): Promise<unknown>;
}

export interface AppBindings {
  DB?: D1DatabaseLike;
  IMAGES_BUCKET?: R2BucketLike;
  ADMIN_JWT_SECRET?: string;
  R2_PUBLIC_BASE_URL?: string;
}

function isD1Database(value: unknown): value is D1DatabaseLike {
  return Boolean(value) && typeof (value as D1DatabaseLike).prepare === "function";
}

export function getBindings(): AppBindings {
  return (env ?? {}) as AppBindings;
}

export function getDbOrNull(): D1DatabaseLike | null {
  const bindings = getBindings();
  if (!isD1Database(bindings.DB)) {
    return null;
  }
  return bindings.DB;
}

export function hasDbBinding(): boolean {
  return getDbOrNull() !== null;
}

function isR2Bucket(value: unknown): value is R2BucketLike {
  return Boolean(value) && typeof (value as R2BucketLike).put === "function";
}

export function getR2BucketOrNull(): R2BucketLike | null {
  const bindings = getBindings();
  if (!isR2Bucket(bindings.IMAGES_BUCKET)) return null;
  return bindings.IMAGES_BUCKET;
}
