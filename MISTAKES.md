# MISTAKES Log

This file logs errors, compilation failures, or hallucinations encountered during development along with their verified resolutions.

---

### [2026-09-04] Initial Setup Strategy
- **Issue**: Need to ensure strict TypeScript types without implicit `any` in state management.
- **Fix**: Defined strong explicit interfaces in `src/types/index.ts` before creating state store and components.

---

### [2026-09-04] TypeScript CLI Execution Before `npm install`
- **Issue**: Executing `npx tsc --noEmit` on a fresh project before `npm install` caused `npx` to attempt fetching the deprecated `tsc` package instead of local TypeScript.
- **Fix**: Run `npm install` first to populate `node_modules/typescript` so `./node_modules/.bin/tsc` is available for typechecking.

---

### [2026-09-04] App Stuck on Loading Screen & Infinite Re-render Loop
- **Issue**: 
  1. `loadStore` in `useMilkStore.ts` was setting `isLoading: true` on every invocation. Both `App.tsx` and `DashboardScreen.tsx` were calling `loadStore` in `useEffect`, causing an infinite unmount/remount loop.
  2. Web dependencies (`react-native-web`, `react-dom`, `@expo/metro-runtime`) were missing in `package.json`.
- **Fix**:
  1. Added `isInitialized` flag in `useMilkStore.ts` so `isLoading: true` is ONLY set on initial app startup.
  2. Removed redundant `loadStore()` call on mount in `DashboardScreen.tsx`.
  3. Installed `react-native-web`, `react-dom`, and `@expo/metro-runtime`.

---

### [2026-09-26] Device B Login Failure ("Invalid Username/Password") Across Devices
- **Issue**: Accounts were stored in local device `AsyncStorage`. When installing APK on Device B, Device B's local storage had no record of accounts created on Device A.
- **Fix**: Upgraded `AuthService` and `CloudSyncService` to use a global online REST cloud database (`https://api.restful-api.dev/objects`).

---

### [2026-10-05] Cross-Device Discovery Failure & Previous Month Data Erasure
- **Issue**:
  1. `GET /objects` without specific ID paginated public objects and failed to find user accounts on new devices, causing Device B login failures.
  2. When pulling cloud data, `purchases` state was directly overwritten with `cloudData.purchases`, erasing past months' historical delivery logs.
  3. Carried forward unpaid balances from previous months were not included in current month summary.
- **Fix**:
  1. Created a Master Cloud Directory (`ff808181a09d98f701a10a620cda79b6`) mapping `username -> cloudObjectId`. Any device querying `username` now looks up the Master Directory and fetches the exact user cloud object directly.
  2. Updated `useMilkStore.ts` to merge local and cloud purchases by date & timeSlot so historical entries across all past months are preserved forever.
  3. Updated `getMonthlySummary` and `MonthlyBillsScreen.tsx` to calculate and display `Previous Carried Balance` + `This Month's Bill` = `Total Outstanding Due`.
