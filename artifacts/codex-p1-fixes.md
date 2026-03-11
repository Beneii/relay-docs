RESULT: done
FILES CHANGED:
- app/src/components/AppIcon.tsx — custom icon images now track load failures and fall back to letter avatars when a URL breaks.
- app/src/hooks/useNotifications.ts — paginated hook exposes an error state and `useMarkAsRead` performs optimistic updates with rollback on failure.
OUTPUT: npm run typecheck
CONFIDENCE: 0.66
