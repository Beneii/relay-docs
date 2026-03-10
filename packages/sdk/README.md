# @relayapp/sdk

Push notifications for any web project. Built for vibe-coders who need instant mobile alerts without wiring up infrastructure.

## Install

```bash
npm install @relayapp/sdk
```

## Quick Start

```ts
import { Relay } from '@relayapp/sdk'

const relay = new Relay({ token: 'WEBHOOK_TOKEN' })
await relay.notify({ title: 'Deploy finished' })
```

## API Reference

### `new Relay({ token, endpoint? })`
Creates a client bound to a dashboard token. Optionally override the API endpoint (defaults to Relay's hosted notify edge function).

### `relay.notify(options)`
Sends a push notification.

```ts
await relay.notify({
  title: 'Stop loss triggered',
  body: 'BTC position closed at $42,100',
  eventType: 'trade.closed',
  metadata: { price: 42100, symbol: 'BTC' },
})
```

### `Relay.notify(token, options, endpoint?)`
Static helper for one-off sends without instantiating a client.

### Options
- `title` (string, required)
- `body`
- `eventType`
- `metadata` (object, up to 4 KB serialized)

### Errors
Throws `RelayError` with `message` + `statusCode`. Helpful messages for 401/429 responses and retries on transient network failures.

## Framework Examples

### Node.js script
```ts
import { Relay } from '@relayapp/sdk'

const relay = new Relay({ token: process.env.RELAY_TOKEN! })
await relay.notify({ title: 'Job done', metadata: { jobId: 42 } })
```

### Browser / fetch replacement
```ts
import { Relay } from '@relayapp/sdk'

async function sendAlert() {
  const relay = new Relay({ token: window.RELAY_TOKEN })
  await relay.notify({ title: 'Door opened', eventType: 'sensor.trigger' })
}
```

### Next.js API Route
```ts
import type { NextRequest } from 'next/server'
import { Relay } from '@relayapp/sdk'

const relay = new Relay({ token: process.env.RELAY_TOKEN! })

export async function POST(req: NextRequest) {
  const payload = await req.json()
  await relay.notify({ title: payload.title, metadata: payload })
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}
```
