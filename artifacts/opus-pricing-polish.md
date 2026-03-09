# Pricing Page Polish

**File:** `src/pages/Pricing.tsx`

## Changes Made

### Excluded features — strikethrough added
- Free tier features not included (`Up to 10 devices`, `Notification history`, `Priority support`) already had:
  - `<X>` icon (lucide) instead of green checkmark
  - `opacity-40` to dim the row
- **Added:** `line-through` text decoration on the label text for additional visual contrast

### Monthly/Annual toggle — already correct
- Toggle at lines 155-167 switches `annual` state
- Monthly: shows `$7.99/month`, "Billed monthly"
- Annual: shows `$6.58/month`, "Billed as $79/year"
- "Save 17%" badge is always visible next to the "Annual" label (green accent text)
- Math check: $6.58 x 12 = $78.96 ~ $79; savings vs $7.99 x 12 = $95.88; ($95.88 - $79) / $95.88 = 17.6% — correct

### No changes needed
- Pro plan features all show green checkmarks
- Upgrade button correctly passes `annual` boolean to `/api/create-checkout`
- Already-pro users see disabled "Current Plan" button
- Unauthenticated users are redirected to `/login` on upgrade click
