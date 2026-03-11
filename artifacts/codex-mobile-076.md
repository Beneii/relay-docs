RESULT: done
FILES CHANGED:
- app/src/hooks/useNotificationHandler.ts — severity-aware foreground handling, action button POST callbacks, deep-link-aware navigation, and cold-start path persistence.
- app/app/(tabs)/_layout.tsx — cold start router now honors pending deep-link paths alongside app IDs.
- app/src/stores/navigationStore.ts — added pendingPath state plus setters/clearer used by notification flow.
- app/app/app/[id].tsx — WebView screen accepts optional path param, constructs merged URL, and updates external open/navigation logic accordingly.
- app/src/hooks/usePushRegistration.ts — registers Android channels for default/warning/critical severities.
OUTPUT:
- npm --prefix app run typecheck (pass)
GAPS: Notification action POSTs are fire-and-forget without retries or auth headers; consider adding secure tokens and error UI in future iteration.
CONFIDENCE: 0.71
