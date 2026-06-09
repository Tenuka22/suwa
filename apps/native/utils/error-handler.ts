export interface ParsedError {
  isSoft: boolean;
  message: string;
  title: string;
}

const ERROR_CATEGORIES: Record<string, { title: string; isSoft: boolean }> = {
  UNAUTHORIZED: { title: "Session expired", isSoft: false },
  FORBIDDEN: { title: "Access denied", isSoft: false },
  NOT_FOUND: { title: "Not found", isSoft: true },
  TIMEOUT: { title: "Request timed out", isSoft: true },
  CONFLICT: { title: "Conflict", isSoft: false },
  PRECONDITION_FAILED: { title: "Invalid state", isSoft: false },
  PAYLOAD_TOO_LARGE: { title: "Data too large", isSoft: false },
  UNPROCESSABLE_CONTENT: { title: "Validation error", isSoft: false },
  TOO_MANY_REQUESTS: { title: "Too many requests", isSoft: true },
  CLIENT_CLOSED_REQUEST: { title: "Connection lost", isSoft: true },
  INTERNAL_SERVER_ERROR: { title: "Server error", isSoft: false },
  BAD_GATEWAY: { title: "Service unavailable", isSoft: true },
  SERVICE_UNAVAILABLE: { title: "Service unavailable", isSoft: true },
  GATEWAY_TIMEOUT: { title: "Service timed out", isSoft: true },
};

const USER_FRIENDLY_MESSAGES: Record<string, string> = {
  "Guardian profile not found":
    "No guardian account found with that email or phone. Ask your guardian to create an account first.",
  "Patient profile not found":
    "Your profile could not be found. Please try signing in again.",
  "Insufficient credits":
    "You don't have enough credits. Purchase more credits to continue.",
  "Session already booked":
    "This time slot is no longer available. Please choose another time.",
  "Invalid session state":
    "This appointment cannot be modified in its current state.",
};

function isNetworkError(error: unknown): boolean {
  if (
    error instanceof TypeError &&
    error.message === "Network request failed"
  ) {
    return true;
  }
  if (error instanceof Error && error.message?.includes("fetch")) {
    return true;
  }
  return false;
}

function extractMessage(error: unknown): string | null {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object") {
    const obj = error as Record<string, unknown>;
    if (typeof obj.message === "string") {
      return obj.message;
    }
    if (typeof obj.error === "string") {
      return obj.error;
    }
  }
  return null;
}

function extractCode(error: unknown): string | null {
  if (error && typeof error === "object") {
    const obj = error as Record<string, unknown>;
    if (typeof obj.code === "string") {
      return obj.code;
    }
    if (typeof obj.status === "number") {
      const statusMap: Record<number, string> = {
        400: "UNPROCESSABLE_CONTENT",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        413: "PAYLOAD_TOO_LARGE",
        422: "UNPROCESSABLE_CONTENT",
        429: "TOO_MANY_REQUESTS",
        500: "INTERNAL_SERVER_ERROR",
        502: "BAD_GATEWAY",
        503: "SERVICE_UNAVAILABLE",
        504: "GATEWAY_TIMEOUT",
      };
      return statusMap[obj.status] ?? null;
    }
  }
  return null;
}

export function parseError(error: unknown): ParsedError {
  if (isNetworkError(error)) {
    return {
      title: "No internet connection",
      message: "Please check your connection and try again.",
      isSoft: true,
    };
  }

  const message = extractMessage(error);
  const code = extractCode(error);

  if (message && USER_FRIENDLY_MESSAGES[message]) {
    const category = ERROR_CATEGORIES[code ?? ""];
    return {
      title: category?.title ?? "Error",
      message: USER_FRIENDLY_MESSAGES[message],
      isSoft: category?.isSoft ?? false,
    };
  }

  if (code && ERROR_CATEGORIES[code]) {
    const category = ERROR_CATEGORIES[code];
    return {
      title: category.title,
      message: message ?? "An unexpected error occurred. Please try again.",
      isSoft: category.isSoft,
    };
  }

  if (
    message?.toLowerCase().includes("payment") ||
    message?.toLowerCase().includes("stripe")
  ) {
    return {
      title: "Payment failed",
      message:
        message ??
        "Your payment could not be processed. Please check your payment method and try again.",
      isSoft: false,
    };
  }

  if (
    message?.toLowerCase().includes("not authorized") ||
    message?.toLowerCase().includes("permission")
  ) {
    return {
      title: "Access denied",
      message: "You don't have permission to perform this action.",
      isSoft: false,
    };
  }

  if (message?.toLowerCase().includes("not found")) {
    return {
      title: "Not found",
      message,
      isSoft: true,
    };
  }

  if (
    message?.toLowerCase().includes("validation") ||
    message?.toLowerCase().includes("required")
  ) {
    return {
      title: "Invalid input",
      message: message ?? "Please check your input and try again.",
      isSoft: false,
    };
  }

  return {
    title: "Something went wrong",
    message: message ?? "An unexpected error occurred. Please try again.",
    isSoft: false,
  };
}

export function _isSoftError(error: unknown): boolean {
  return parseError(error).isSoft;
}
