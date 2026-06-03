/**
 * Shared API client utility with retry, timeout, and consistent error handling.
 */

/** Custom error class for API failures, carrying HTTP status and original error. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiOptions {
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Base delay between retries in ms — doubles each attempt (default: 1000) */
  retryDelay?: number;
}

const DEFAULT_RETRIES = 3;
const DEFAULT_TIMEOUT = 10_000;
const DEFAULT_RETRY_DELAY = 1_000;

/**
 * Fetches a URL with automatic retry, timeout, and error handling.
 *
 * - Uses AbortController for request timeout.
 * - Retries on network errors and 5xx responses with exponential backoff.
 * - Skips retry for 4xx client errors (they won't succeed on retry).
 * - Parses error responses as JSON when possible, falls back to text.
 *
 * @param url - The URL to fetch
 * @param init - Standard RequestInit options
 * @param options - Retry, timeout, and delay configuration
 * @returns Parsed JSON response of type T
 * @throws {ApiError} On non-OK responses or network failures after all retries
 */
export async function apiFetch<T>(
  url: string,
  init?: RequestInit,
  options?: ApiOptions,
): Promise<T> {
  const {
    retries = DEFAULT_RETRIES,
    timeout = DEFAULT_TIMEOUT,
    retryDelay = DEFAULT_RETRY_DELAY,
  } = options ?? {};

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return (await response.json()) as T;
      }

      // Parse error body
      let errorMessage: string;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.error ?? errorBody.message ?? JSON.stringify(errorBody);
      } catch {
        errorMessage = await response.text().catch(() => `HTTP ${response.status}`);
      }

      const apiError = new ApiError(response.status, errorMessage);

      // Don't retry 4xx — client errors won't resolve themselves
      if (response.status >= 400 && response.status < 500) {
        throw apiError;
      }

      lastError = apiError;
    } catch (err: any) {
      clearTimeout(timeoutId);

      // Re-throw 4xx ApiErrors immediately (no retry)
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }

      // Wrap abort / network errors
      if (err.name === 'AbortError') {
        lastError = new ApiError(0, `Request timed out after ${timeout}ms`, err);
      } else if (!(err instanceof ApiError)) {
        lastError = new ApiError(0, err.message ?? 'Network error', err);
      } else {
        lastError = err;
      }
    }

    // Wait before retrying (exponential backoff), but not after last attempt
    if (attempt < retries) {
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError ?? new ApiError(0, 'Request failed after all retries');
}
