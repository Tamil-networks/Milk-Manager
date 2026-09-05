import { create } from 'zustand';
import { PurchaseEntry, VendorInfo, PaymentRecord, MonthlyBillSummary, TimeSlot, DeliveryStatus } from '../types';
import { StorageService, DEFAULT_VENDOR } from '../storage/asyncStorageService';

interface MilkStoreState {
  isInitialized: boolean;
  isLoading: boolean;
  purchases: PurchaseEntry[];
  payments: PaymentRecord[];
  vendorInfo: VendorInfo;

  // Actions
  loadStore: () => Promise<void>;
  logPurchase: (
    date: string,
    timeSlot: TimeSlot,
    quantityInLiters: number,
    customPrice?: number,
    status?: DeliveryStatus,
    notes?: string
  ) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  updateVendorInfo: (info: VendorInfo) => Promise<void>;
  addPayment: (date: string, amount: number, notes?: string) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  resetAllData: () => Promise<void>;

  // Selectors / Helpers
  calculatePrice: (qtyInLiters: number) => number;
  getEntryForSlot: (date: string, timeSlot: TimeSlot) => PurchaseEntry | undefined;
  getMonthlySummary: (monthYear: string) => MonthlyBillSummary;
}

export const useMilkStore = create<MilkStoreState>((set, get) => ({
  isInitialized: false,
  isLoading: true,
  purchases: [],
  payments: [],
  vendorInfo: DEFAULT_VENDOR,

  calculatePrice: (qtyInLiters: number) => {
    const { vendorInfo } = get();
    if (qtyInLiters === 0.5) return vendorInfo.priceHalfLiter;
    if (qtyInLiters === 1.0) return vendorInfo.priceOneLiter;
    // For other quantities, scale proportionally based on 1L price
    return (qtyInLiters / 1.0) * vendorInfo.priceOneLiter;
  },

  loadStore: async () => {
    const { isInitialized } = get();
    if (!isInitialized) {
      set({ isLoading: true });
    }
    try {
      const purchases = await StorageService.getPurchases();
      const payments = await StorageService.getPayments();
      const vendorInfo = await StorageService.getVendorInfo();
      set({ purchases, payments, vendorInfo, isLoading: false, isInitialized: true });
    } catch (e) {
      console.error('Error loading store data:', e);
      set({ isLoading: false, isInitialized: true });
    }
  },

  logPurchase: async (date, timeSlot, quantityInLiters, customPrice, status = 'received', notes = '') => {
    const { purchases, calculatePrice } = get();
    const calculatedPrice = customPrice !== undefined ? customPrice : calculatePrice(quantityInLiters);

    // Check if entry for this date & slot already exists
    const existingIndex = purchases.findIndex(
      (p) => p.date === date && p.timeSlot === timeSlot
    );

    let updatedPurchases: PurchaseEntry[];

    if (existingIndex >= 0) {
      updatedPurchases = [...purchases];
      updatedPurchases[existingIndex] = {
        ...updatedPurchases[existingIndex],
        quantityInLiters,
        price: calculatedPrice,
        status,
        notes,
      };
    } else {
      const newEntry: PurchaseEntry = {
        id: `${date}_${timeSlot}_${Date.now()}`,
        date,
        timeSlot,
        quantityInLiters,
        price: calculatedPrice,
        status,
        notes,
      };
      updatedPurchases = [newEntry, ...purchases];
    }

    set({ purchases: updatedPurchases });
    await StorageService.savePurchases(updatedPurchases);
  },

  deletePurchase: async (id: string) => {
    const { purchases } = get();
    const updated = purchases.filter((p) => p.id !== id);
    set({ purchases: updated });
    await StorageService.savePurchases(updated);
  },

  updateVendorInfo: async (info: VendorInfo) => {
    set({ vendorInfo: info });
    await StorageService.saveVendorInfo(info);
  },

  addPayment: async (date: string, amount: number, notes = '') => {
    const { payments } = get();
    const newPayment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      date,
      amount,
      notes,
    };
    const updated = [newPayment, ...payments];
    set({ payments: updated });
    await StorageService.savePayments(updated);
  },

  deletePayment: async (id: string) => {
    const { payments } = get();
    const updated = payments.filter((p) => p.id !== id);
    set({ payments: updated });
    await StorageService.savePayments(updated);
  },

  resetAllData: async () => {
    await StorageService.clearAllData();
    set({ purchases: [], payments: [], vendorInfo: DEFAULT_VENDOR });
  },

  getEntryForSlot: (date: string, timeSlot: TimeSlot) => {
    return get().purchases.find((p) => p.date === date && p.timeSlot === timeSlot);
  },

  getMonthlySummary: (monthYear: string) => {
    const { purchases, payments } = get();

    // Filter purchases for monthYear (e.g., '2026-09')
    const monthPurchases = purchases.filter(
      (p) => p.date.startsWith(monthYear) && p.status === 'received'
    );

    const totalLiters = monthPurchases.reduce((sum, p) => sum + p.quantityInLiters, 0);
    const totalCost = monthPurchases.reduce((sum, p) => sum + p.price, 0);

    // Filter payments for monthYear
    const monthPayments = payments.filter((p) => p.date.startsWith(monthYear));
    const totalPaid = monthPayments.reduce((sum, p) => sum + p.amount, 0);

    const balanceDue = totalCost - totalPaid;

    return {
      monthYear,
      totalLiters: Number(totalLiters.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      totalPaid: Number(totalPaid.toFixed(2)),
      balanceDue: Number(balanceDue.toFixed(2)),
    };
  },
}));
