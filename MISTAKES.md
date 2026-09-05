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
  1. `loadStore` in `useMilkStore.ts` was setting `isLoading: true` on every invocation. Both `App.tsx` and `DashboardScreen.tsx` were calling `loadStore` in `useEffect`, causing an infinite unmount/remount loop (App showing home for 1s then reloading endlessly).
  2. Web dependencies (`react-native-web`, `react-dom`, `@expo/metro-runtime`) were missing in `package.json`.
- **Fix**:
  1. Added `isInitialized` flag in `useMilkStore.ts` so `isLoading: true` is ONLY set on initial app startup.
  2. Removed redundant `loadStore()` call on mount in `DashboardScreen.tsx`.
  3. Installed `react-native-web`, `react-dom`, and `@expo/metro-runtime`.
