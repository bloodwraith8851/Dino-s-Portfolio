/**
 * Centralized error reporting with Sentry integration.
 * Falls back to console if VITE_SENTRY_DSN is not set (matches repo's graceful-degradation pattern).
 */

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

let sentryInitialized = false;

/**
 * Initializes error reporting. Call once at app startup.
 * If VITE_SENTRY_DSN is not set, errors are logged to console only.
 */
export function initErrorReporting(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) {
    console.info('[errorReporting] No VITE_SENTRY_DSN set — errors will be logged to console only.');
    return;
  }
  // Placeholder for Sentry.init() — drop in @sentry/react when ready
  // import * as Sentry from '@sentry/react';
  // Sentry.init({ dsn, environment: import.meta.env.MODE });
  sentryInitialized = true;
}

/**
 * Captures an error with optional context metadata.
 */
export function captureError(error: Error, context?: ErrorContext): void {
  console.error(`[${context?.component ?? 'unknown'}]`, error.message, context);
  if (sentryInitialized) {
    // Sentry.captureException(error, { extra: context });
  }
}
