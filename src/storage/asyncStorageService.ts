import AsyncStorage from '@react-native-async-storage/async-storage';
import { PurchaseEntry, VendorInfo, PaymentRecord } from '../types';

const STORAGE_KEYS = {
  PURCHASES: '@milk_manager_purchases',
  VENDOR: '@milk_manager_vendor',
  PAYMENTS: '@milk_manager_payments',
};

export const DEFAULT_VENDOR: VendorInfo = {
  vendorName: 'Local Dairy / Milkman',
  phone: '',
  defaultMorningQty: 0.5,
  defaultEveningQty: 0.5,
  priceHalfLiter: 25,
  priceOneLiter: 50,
};

export const StorageService = {
  async getPurchases(): Promise<PurchaseEntry[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PURCHASES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading purchases from storage', e);
      return [];
    }
  },

  async savePurchases(purchases: PurchaseEntry[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
    } catch (e) {
      console.error('Error saving purchases to storage', e);
    }
  },

  async getVendorInfo(): Promise<VendorInfo> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.VENDOR);
      return data ? JSON.parse(data) : DEFAULT_VENDOR;
    } catch (e) {
      console.error('Error reading vendor info from storage', e);
      return DEFAULT_VENDOR;
    }
  },

  async saveVendorInfo(vendor: VendorInfo): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.VENDOR, JSON.stringify(vendor));
    } catch (e) {
      console.error('Error saving vendor info to storage', e);
    }
  },

  async getPayments(): Promise<PaymentRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading payments from storage', e);
      return [];
    }
  },

  async savePayments(payments: PaymentRecord[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    } catch (e) {
      console.error('Error saving payments to storage', e);
    }
  },

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PURCHASES,
        STORAGE_KEYS.VENDOR,
        STORAGE_KEYS.PAYMENTS,
      ]);
    } catch (e) {
      console.error('Error clearing data', e);
    }
  },
};
