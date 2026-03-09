# Relay

A mobile control app for dashboards and automations. Save your tools, receive push notifications, and open the right dashboard directly from an alert.

## What Relay Does

1. **Save apps** — Add any dashboard, tool, or web-based system as a saved app.
2. **One-tap launch** — Open saved apps in a full-screen native view.
3. **Push notifications** — External systems send alerts to your saved apps via webhook.
4. **Deep routing** — Tap a notification to open the exact app it belongs to.

Relay is a launcher for self-hosted tools and a native push bridge for web-based systems. It is not a browser.

## Stack

- **Mobile:** Expo, React Native, TypeScript, Expo Router, Zustand, TanStack Query
- **Backend:** Supabase (Postgres, Auth, Edge Functions)
- **Auth:** Email magic link (Supabase Auth)
- **Push:** Expo Push Notifications

## Project Structure

```
/app                    # Expo/React Native mobile app
  /app                  # Expo Router screens
  /src
    /components         # Shared UI components
    /hooks              # Data fetching and push hooks
    /lib                # Supabase client
    /stores             # Zustand stores
    /theme              # Colors, spacing, typography
    /types              # TypeScript types
    /utils              # URL validation, time formatting
    /__tests__          # Unit tests
/backend
  /supabase
    /migrations         # SQL schema
    /functions          # Edge Functions (notify, register-device)
/docs                   # Release materials
```

## Setup

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli` or use `npx expo`)
- Supabase account and project
- EAS account (for push notifications and builds)

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Run the migration:
   ```bash
   # Option A: Use Supabase CLI
   cd backend
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push

   # Option B: Run SQL manually
   # Copy contents of backend/supabase/migrations/00001_initial_schema.sql
   # and run it in the Supabase SQL editor.
   ```
3. Deploy Edge Functions:
   ```bash
   cd backend
   supabase functions deploy notify
   supabase functions deploy register-device
   ```
4. In Supabase Dashboard → Authentication → URL Configuration:
   - Set Site URL to `relay://auth-callback`
   - Add `relay://auth-callback` to Redirect URLs

### 2. Mobile App Setup

```bash
cd app
cp .env.example .env
# Edit .env with your Supabase URL and anon key

npm install
npx expo start
```

### 3. EAS Setup (for builds & push)

```bash
npm install -g eas-cli
eas login
eas build:configure

# Update app.json with your EAS project ID
# For iOS push: eas credentials
# For Android push: Add google-services.json
```

### 4. Environment Variables

**Mobile app** (`.env`):
```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Supabase Edge Functions** (set via Supabase Dashboard → Edge Functions → Secrets):
```
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Webhook API

Send push notifications to any saved app via its webhook token:

```bash
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/notify/WEBHOOK_TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build completed",
    "body": "QA passed successfully",
    "eventType": "build.complete",
    "metadata": {
      "buildId": "123",
      "status": "success"
    }
  }'
```

### Request Body

| Field      | Type   | Required | Description                     |
|------------|--------|----------|---------------------------------|
| title      | string | Yes      | Notification title (max 500)    |
| body       | string | No       | Notification body (max 2000)    |
| eventType  | string | No       | Event type identifier           |
| metadata   | object | No       | Arbitrary JSON metadata         |

### Response

```json
{
  "success": true,
  "notificationId": "uuid",
  "pushed": 2
}
```

## Development

```bash
cd app

# Run
npx expo start

# Type check
npm run typecheck

# Lint
npm run lint

# Format
npm run format

# Test
npm run test
```

## Building for Release

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production

# Submit
eas submit --platform ios
eas submit --platform android
```

See [RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md) for the full pre-release checklist.

## License

Proprietary. All rights reserved.
