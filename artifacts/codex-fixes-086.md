RESULT: done
FILES CHANGED:
- packages/sdk/src/types.ts — added RelayAction/RelaySeverity plus actions/severity/channel fields on NotifyOptions and RelayRequestBody.
- packages/sdk/src/relay.ts — now forwards interactive fields in buildRequestBody so SDK users can send actions, severity, and channel.
- backend/shared/product.ts — raised FREE_LIMITS.notificationsPerMonth to 500 to match pricing copy.
- src/App.tsx — hero secondary CTA now anchors to the on-page docs section, terminal demo shows SDK usage, and phone preview copy references “your dashboard.”
- src/features/landing/content.ts — FAQ answers reworded to describe Relay as a builder-focused runtime instead of a consumer dashboard saver.
OUTPUT:
- npm run typecheck
- (cd packages/sdk && npx tsc)
GAPS/ASSUMPTIONS:
- Documentation link now scrolls to #api on the same page; assuming this section sufficiently acts as interim docs until a dedicated /docs route exists.
CONFIDENCE: 0.81
