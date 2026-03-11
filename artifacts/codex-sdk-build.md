RESULT: done
FILES CREATED:
- packages/sdk/package.json
- packages/sdk/tsconfig.json
- packages/sdk/README.md
- packages/sdk/src/index.ts
- packages/sdk/src/relay.ts
- packages/sdk/src/types.ts
- packages/sdk/dist/* (tsc output)
API SURFACE: exports Relay class (instance + static notify), RelayError, DEFAULT_ENDPOINT constant, and NotifyOptions/NotifyResponse/RelayConfig types via packages/sdk/src/index.ts.
OUTPUT: `npx tsc -p packages/sdk/tsconfig.json` (success, no warnings).
CONFIDENCE: 0.78
GAPS/ASSUMPTIONS: Assumed extending repo root tsconfig.json was acceptable and that Relay.notify static helper can take optional endpoint override even though spec only showed two parameters; no integration tests with live Supabase endpoint were run.
