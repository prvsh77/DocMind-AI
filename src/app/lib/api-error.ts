import type { AxiosError } from "axios";

export type ApiErrorPayload = {
  message?: string;
  code?: string;
  errors?: Record<string, string[] | string>;
};

export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: ApiErrorPayload["errors"];

  constructor(message: string, status?: number, code?: string, details?: ApiErrorPayload["errors"]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const toApiError = (error: unknown): ApiError => {
  const axiosError = error as AxiosError<ApiErrorPayload>;

  if (axiosError?.isAxiosError) {
    const payload = axiosError.response?.data;
    const message =
      payload?.message ??
      axiosError.message ??
      "Something went wrong while contacting the DocMind API.";

    return new ApiError(message, axiosError.response?.status, payload?.code, payload?.errors);
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError("An unexpected error occurred.");
};
