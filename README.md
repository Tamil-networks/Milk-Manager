# Milk Manager - Household Milk Tracker with Account Sync

A privacy-first mobile application built with React Native (Expo) and TypeScript for household milk buyers to track daily milk purchases, log morning and evening deliveries, manage custom milk rates, and automatically sync data across multiple mobile devices using Username & Password authentication.

## Key Features
- **Username & Password Authentication**: Create an account or sign in to access your milk records on any device.
- **Cross-Device Account Sync**: Log in on Device B with the same Username & Password created on Device A to automatically sync your milk purchase logs, payments, and settings.
- **1-Tap Quick Logging**: Log ½ Liter (₹25) or 1 Liter (₹50) deliveries in a single tap.
- **Custom Quantity & Rates**: Easily override volume (e.g., 0.25L, 1.5L, 2L) and price per unit.
- **Morning & Evening Slots**: Independent slot tracking for each day.
- **Calendar & Daily History**: View, edit, or mark days as skipped/extra.
- **Monthly Expenses & Payments**: Automatic total cost calculation, log payments made to milkman, and view balance due.
- **Offline-First Architecture**: Fast local offline storage via AsyncStorage with background cloud repository synchronization.

## Project Structure
```
d:/Milk_Manager/
├── App.tsx                    # Root Entry & Auth State Hydration
├── app.json                   # Expo Config
├── eas.json                   # Android Standalone APK Build Config
├── package.json               # Dependencies & Scripts
├── tsconfig.json              # TypeScript Config
├── README.md                  # Project Documentation
├── MISTAKES.md                # Error & Solution Log
└── src/
    ├── types/                 # TypeScript Domain & Auth Models
    ├── storage/               # Offline AsyncStorage Wrapper
    ├── services/
    │   ├── authService.ts     # Account Sign In / Sign Up & Session Manager
    │   └── cloudSyncService.ts# Cross-Device Cloud Data Repository Sync
    ├── store/                 # Zustand Stores (useAuthStore, useMilkStore)
    ├── navigation/            # RootNavigator, AuthNavigator, AppNavigator
    ├── screens/               # Login, Register, Dashboard, DailyLog, Bills, Settings
    └── components/            # UI Components (Cards, Quick Buttons, Modals)
```

## Running the App
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npx expo start
   ```
