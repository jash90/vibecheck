/**
 * Sentry-compatible error monitoring adapter. Stub in Phase 4 — real Sentry
 * integration in Phase 5 (needs `@sentry/react-native` dep + native rebuild
 * with the config plugin).
 */

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const enabled = Boolean(DSN);

export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (!enabled) {
    if (__DEV__) console.warn('[telemetry]', err, context ?? {});
    return;
  }
  pendingErrors.push({ err, context: context ?? {}, at: Date.now() });
}

export function captureBreadcrumb(message: string, data?: Record<string, unknown>): void {
  if (!enabled) return;
  pendingBreadcrumbs.push({ message, data: data ?? {}, at: Date.now() });
}

const pendingErrors: { err: unknown; context: Record<string, unknown>; at: number }[] = [];
const pendingBreadcrumbs: {
  message: string;
  data: Record<string, unknown>;
  at: number;
}[] = [];

export function peekErrors(): number {
  return pendingErrors.length;
}

export function peekBreadcrumbs(): number {
  return pendingBreadcrumbs.length;
}
