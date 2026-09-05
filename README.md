# Milk Manager - Personal Offline Household Milk Tracker

A 100% offline, privacy-first mobile application built with React Native (Expo) and TypeScript for household milk buyers to track daily milk purchases, log morning and evening deliveries, manage custom milk quantities & rates, and track monthly bills and payments.

## Key Features
- **1-Tap Quick Logging**: Log ½ Liter (₹25) or 1 Liter (₹50) deliveries in a single tap.
- **Custom Quantity & Rates**: Easily override volume (e.g., 0.25L, 1.5L, 2L) and price for special days.
- **Morning & Evening Slots**: Independent slot tracking for each day.
- **Calendar & Daily History**: View, edit, or mark days as skipped/extra.
- **Monthly Expenses & Payments**: Automatic total cost calculation, log payments made to milkman, and view balance due.
- **100% Offline**: Data stored securely on your device using AsyncStorage.

## Project Structure
```
d:/Milk_Manager/
├── App.tsx                    # Root Entry & Navigation
├── app.json                   # Expo Config
├── package.json               # Dependencies & Scripts
├── tsconfig.json              # TypeScript Config
├── babel.config.js            # Babel Config
├── README.md                  # Project Documentation
├── MISTAKES.md                # Error & Solution Log
├── agy-expo-prompt.md         # Master Prompt Configuration
└── src/
    ├── types/                 # TypeScript Domain Models
    ├── storage/               # Offline AsyncStorage Wrapper
    ├── store/                 # Zustand Global App State
    ├── navigation/            # Navigation Containers & Tab Navigators
    ├── screens/               # Dashboard, DailyLog, MonthlyBills, Settings
    └── components/            # UI Components (Cards, Buttons, Modals)
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
