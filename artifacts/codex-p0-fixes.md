RESULT: done
FILES CHANGED:
- app/app/app/[id].tsx — moved the `if (!session)` guard below all hooks so no hooks are conditionally skipped.
- app/app/edit-app.tsx — same hook-order fix; all hooks now run before returning.
- src/pages/NotFound.tsx, src/App.tsx, src/pages/Signup.tsx, src/pages/ResetPassword.tsx, src/components/ErrorBoundary.tsx, src/pages/Dashboard.tsx, src/features/dashboard/OnboardingBanner.tsx, src/features/dashboard/AccountSidebar.tsx, src/pages/Login.tsx, src/features/dashboard/MembersModal.tsx, src/features/dashboard/DashboardListSection.tsx, src/pages/InviteAccept.tsx, src/features/dashboard/ComposeNotificationModal.tsx, src/features/dashboard/modals.tsx, src/pages/Pricing.tsx, src/features/landing/MobileDownloadSection.tsx, src/features/landing/LandingNav.tsx — replaced `hover:bg-emerald-600` with `hover:bg-blue-600` for consistent brand color.
OUTPUT: npm run typecheck (pass)
