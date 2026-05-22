import type {
  ApiDataResponse,
  ApiErrorPayload,
  ApiErrorResponse,
  ApiItemsResponse,
} from "@/lib/api/types";

export function jsonData<T>(data: T, init?: ResponseInit): Response {
  const payload: ApiDataResponse<T> = { data };
  return Response.json(payload, init);
}

export function jsonItems<T>(items: T[], init?: ResponseInit): Response {
  const payload: ApiItemsResponse<T> = { items };
  return Response.json(payload, init);
}

export function jsonError(
  message: string,
  code: string,
  status = 500,
  init?: Omit<ResponseInit, "status">,
): Response {
  const payload: ApiErrorResponse = {
    error: {
      message,
      code,
    } satisfies ApiErrorPayload,
  };

  return Response.json(payload, { ...init, status });
}

export function withSourceHeader(response: Response, source: "db" | "fallback"): Response {
  response.headers.set("x-data-source", source);
  return response;
}
