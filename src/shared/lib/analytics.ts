/**
 * Analytics adapter — PostHog-compatible surface area. In Phase 4 this is a
 * no-op that logs in dev. Wire a real client in Phase 5 once the self-hosted
 * EU instance is up. Never pass PII — only event names + anonymized props.
 */

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST;
const enabled = Boolean(POSTHOG_KEY && POSTHOG_HOST);

type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(event: string, props?: AnalyticsProps): void {
  if (!enabled) {
    if (__DEV__) console.warn('[analytics]', event, props ?? {});
    return;
  }
  // Real PostHog client initialization lives in Phase 5. For now, queue events.
  pendingQueue.push({ event, props: props ?? {}, at: Date.now() });
}

export function identifyAnon(anonId: string): void {
  if (!enabled) return;
  pendingAnonId = anonId;
}

const pendingQueue: { event: string; props: AnalyticsProps; at: number }[] = [];
let pendingAnonId: string | null = null;

export function flushQueueLength(): number {
  return pendingQueue.length;
}

export function peekQueue(): readonly {
  event: string;
  props: AnalyticsProps;
  at: number;
}[] {
  return pendingQueue;
}

export function peekAnonId(): string | null {
  return pendingAnonId;
}
