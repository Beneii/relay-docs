# Relay — Release Checklist

## Environment & Configuration

- [ ] `EXPO_PUBLIC_SUPABASE_URL` set in production environment
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` set in production environment
- [ ] Supabase Edge Function secrets configured (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] EAS project ID set in `app.json` → `extra.eas.projectId`
- [ ] App version bumped in `app.json`

## Supabase

- [ ] Migration `00001_initial_schema.sql` applied to production database
- [ ] Row Level Security enabled on all tables
- [ ] `notify` Edge Function deployed
- [ ] `register-device` Edge Function deployed
- [ ] Auth redirect URL configured: `relay://auth-callback`
- [ ] Email templates customized (optional)

## Push Notifications

- [ ] iOS: APNs key uploaded to EAS (`eas credentials`)
- [ ] Android: `google-services.json` added to `app/`
- [ ] Android: Firebase Cloud Messaging configured
- [ ] Expo Push token registration tested on physical device
- [ ] Webhook → notification → push delivery tested end-to-end
- [ ] Cold start from notification routes to correct app
- [ ] Background resume from notification routes to correct app
- [ ] Foreground notification banner displays correctly

## Auth

- [ ] Magic link email sends successfully
- [ ] Magic link opens app and authenticates (deep link `relay://auth-callback`)
- [ ] Session persists across app restarts
- [ ] Session restoration handles expired tokens gracefully
- [ ] Sign out clears session and returns to auth screen
- [ ] Invalid/expired magic links handled gracefully

## Core Flows

- [ ] Add a new saved app (name, URL, icon, color)
- [ ] Edit an existing saved app
- [ ] Delete a saved app
- [ ] Open saved app in WebView — page loads correctly
- [ ] WebView exit button returns to home
- [ ] WebView refresh works
- [ ] WebView "Open in Browser" works
- [ ] Webhook URL copy works from edit screen
- [ ] Notification history displays in Alerts tab
- [ ] Notification tap opens correct saved app
- [ ] Mark notification as read
- [ ] Mark all as read
- [ ] Settings → theme toggle cycles correctly
- [ ] Settings → sign out works

## URL Validation

- [ ] HTTPS public URL accepted
- [ ] HTTP public URL rejected
- [ ] HTTP localhost accepted with warning
- [ ] HTTP 192.168.x.x accepted with warning
- [ ] HTTP 10.x.x.x accepted with warning
- [ ] Invalid URL rejected
- [ ] Missing protocol auto-prepends https://

## iOS Specific

- [ ] Bundle identifier set: `com.relay.app`
- [ ] App icon provided (1024x1024)
- [ ] Splash screen configured
- [ ] `NSCameraUsageDescription` present (required by some dependencies)
- [ ] `UIBackgroundModes` includes `remote-notification`
- [ ] Deep link scheme `relay://` registered
- [ ] TestFlight build tested
- [ ] App Store screenshots captured
- [ ] App Store description submitted
- [ ] Privacy policy URL provided
- [ ] App Review notes prepared

## Android Specific

- [ ] Package name set: `com.relay.app`
- [ ] Adaptive icon provided
- [ ] `google-services.json` in place
- [ ] Notification channel configured
- [ ] Deep link scheme `relay://` registered
- [ ] Internal testing build tested
- [ ] Play Store screenshots captured
- [ ] Play Store description submitted
- [ ] Privacy policy URL provided
- [ ] Content rating questionnaire completed

## Code Quality

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes (or warnings reviewed)
- [ ] `npm run test` passes
- [ ] No secrets in source code
- [ ] No TODO/FIXME in critical paths

## Performance

- [ ] App loads in < 2s on cold start
- [ ] WebView loads saved app without visible flicker
- [ ] Navigation transitions are smooth
- [ ] No unnecessary re-renders on home screen

## Post-Release

- [ ] Monitor Supabase Edge Function logs for errors
- [ ] Monitor push delivery rates
- [ ] Verify webhook endpoint is reachable from external systems
- [ ] Confirm app updates via EAS Update if using OTA
