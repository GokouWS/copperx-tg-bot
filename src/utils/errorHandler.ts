// src/utils/errorHandler.ts
import { Context } from "telegraf";
import { AxiosError } from "axios";

export class ApiError extends Error {
  statusCode?: number;
  responseBody?: any;

  constructor(message: string, statusCode?: number, responseBody?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;

    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function createApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const statusCode = error.response?.status;
    const responseBody = error.response?.data;
    let message = error.message || "Unknown Axios error"; // Default

    // console.log("Axios Error - Full Response:", error.response); // LOG THE ENTIRE RESPONSE

    if (responseBody && typeof responseBody === "object") {
      // Check for 'errors' array (most common for validation)
      if (responseBody.errors && Array.isArray(responseBody.errors)) {
        const detailMessages = responseBody.errors
          .map((detail: any) => {
            if (detail && typeof detail === "object" && detail.message) {
              return detail.message;
            } else if (typeof detail === "string") {
              return detail;
            } else if (detail && typeof detail === "object" && detail.msg) {
              // Check for 'msg'
              return detail.msg;
            } else if (detail && typeof detail === "object" && detail.error) {
              //Check for 'error'
              return detail.error;
            }
            return null;
          })
          .filter(Boolean);

        if (detailMessages.length > 0) {
          message = detailMessages.join("; ");
          return new ApiError(message, statusCode, responseBody); // Return early
        }
      }

      // Check for 'message' as a string (less common, but possible)
      if (typeof responseBody.message === "string") {
        message = responseBody.message;
        return new ApiError(message, statusCode, responseBody); // Return early
      }

      // Check for 'error' as a string (less common, but possible)
      if (typeof responseBody.error === "string") {
        message = responseBody.error;
        return new ApiError(message, statusCode, responseBody); // Return early
      }
    }

    // Fallback: Use the default Axios message and include the status code
    return new ApiError(message, statusCode, responseBody);
  } else if (error instanceof Error) {
    return new ApiError(error.message);
  } else {
    return new ApiError(`An unknown error occurred: ${String(error)}`);
  }
}

// No changes needed in handleApiError, it's already correct:
export function handleApiError(ctx: Context, error: unknown) {
  if (error instanceof ApiError) {
    let message = error.message;
    // if (error.statusCode) {
    //   message += ` (Status Code: ${error.statusCode})`;
    // }
    ctx.reply(message);

    console.error("API Error Details:", {
      message: error.message,
      statusCode: error.statusCode,
      responseBody: {
        ...error.responseBody,
        message: JSON.stringify(error.responseBody.message),
      },
      stack: error.stack,
    });
  } else {
    ctx.reply("An unexpected error occurred.");
    console.error(error);
  }
}
