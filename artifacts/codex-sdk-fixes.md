RESULT: done
FILES CHANGED:
- packages/sdk/src/types.ts — added deep-link `url` field to `NotifyOptions`/`RelayRequestBody` so payloads omit tokens while carrying tap targets.
- packages/sdk/src/relay.ts — updated default endpoint + token validation, moved tokens to path, added metadata/url handling, retry/timeout support, and improved JSON parsing errors.
- packages/sdk/package.json — declared Node 18 engine requirement and TypeScript devDependency per publish guidelines.
- packages/sdk/tsconfig.json — replaced inherited config with standalone strict compiler settings for the package.
OUTPUT:
- `cd packages/sdk && npx tsc` (success, no output)
CONFIDENCE: 0.71
