import { create } from 'zustand';
import { PurchaseEntry, VendorInfo, PaymentRecord, MonthlyBillSummary, TimeSlot, DeliveryStatus, User } from '../types';
import { StorageService, DEFAULT_VENDOR } from '../storage/asyncStorageService';
import { CloudSyncService } from '../services/cloudSyncService';

interface ExtendedMonthlySummary extends MonthlyBillSummary {
  previousBalanceDue: number;
  totalBalanceDue: number;
}

interface MilkStoreState {
  isInitialized: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  purchases: PurchaseEntry[];
  payments: PaymentRecord[];
  vendorInfo: VendorInfo;

  // Actions
  loadStore: (currentUser?: User | null) => Promise<void>;
  syncWithCloud: (currentUser: User) => Promise<void>;
  logPurchase: (
    date: string,
    timeSlot: TimeSlot,
    quantityInLiters: number,
    customPrice?: number,
    status?: DeliveryStatus,
    notes?: string,
    currentUser?: User | null
  ) => Promise<void>;
  deletePurchase: (id: string, currentUser?: User | null) => Promise<void>;
  updateVendorInfo: (info: VendorInfo, currentUser?: User | null) => Promise<void>;
  addPayment: (date: string, amount: number, notes?: string, currentUser?: User | null) => Promise<void>;
  deletePayment: (id: string, currentUser?: User | null) => Promise<void>;
  resetAllData: () => Promise<void>;

  // Selectors / Helpers
  calculatePrice: (qtyInLiters: number) => number;
  getEntryForSlot: (date: string, timeSlot: TimeSlot) => PurchaseEntry | undefined;
  getMonthlySummary: (monthYear: string) => ExtendedMonthlySummary;
}

/**
 * Merge local and cloud purchases by date and timeSlot to preserve all historical months
 */
const mergePurchases = (local: PurchaseEntry[], cloud: PurchaseEntry[]): PurchaseEntry[] => {
  const map = new Map<string, PurchaseEntry>();

  // Add all local purchases
  local.forEach((p) => {
    const key = `${p.date}_${p.timeSlot}`;
    map.set(key, p);
  });

  // Merge cloud purchases (cloud takes precedence for same slot if newer)
  cloud.forEach((p) => {
    const key = `${p.date}_${p.timeSlot}`;
    map.set(key, p);
  });

  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
};

/**
 * Merge local and cloud payments
 */
const mergePayments = (local: PaymentRecord[], cloud: PaymentRecord[]): PaymentRecord[] => {
  const map = new Map<string, PaymentRecord>();

  local.forEach((p) => map.set(p.id, p));
  cloud.forEach((p) => map.set(p.id, p));

  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
};

export const useMilkStore = create<MilkStoreState>((set, get) => ({
  isInitialized: false,
  isLoading: true,
  isSyncing: false,
  lastSyncedAt: null,
  purchases: [],
  payments: [],
  vendorInfo: DEFAULT_VENDOR,

  calculatePrice: (qtyInLiters: number) => {
    const { vendorInfo } = get();
    if (qtyInLiters === 0.5) return vendorInfo.priceHalfLiter;
    if (qtyInLiters === 1.0) return vendorInfo.priceOneLiter;
    return (qtyInLiters / 1.0) * vendorInfo.priceOneLiter;
  },

  loadStore: async (currentUser?: User | null) => {
    const { isInitialized } = get();
    if (!isInitialized) {
      set({ isLoading: true });
    }

    try {
      let localPurchases = await StorageService.getPurchases();
      let localPayments = await StorageService.getPayments();
      let vendorInfo = await StorageService.getVendorInfo();
      let lastSyncedAt: string | null = null;

      let mergedPurchases = localPurchases;
      let mergedPayments = localPayments;

      // If user is logged in, pull & merge cloud historical records
      if (currentUser?.username) {
        const cloudData = await CloudSyncService.pullCloudData(currentUser.username);
        if (cloudData) {
          mergedPurchases = mergePurchases(localPurchases, cloudData.purchases || []);
          mergedPayments = mergePayments(localPayments, cloudData.payments || []);
          vendorInfo = cloudData.vendorInfo || vendorInfo || DEFAULT_VENDOR;
          lastSyncedAt = cloudData.updatedAt;

          // Save complete merged dataset locally
          await StorageService.savePurchases(mergedPurchases);
          await StorageService.savePayments(mergedPayments);
          await StorageService.saveVendorInfo(vendorInfo);
        }
      }

      set({
        purchases: mergedPurchases,
        payments: mergedPayments,
        vendorInfo,
        lastSyncedAt,
        isLoading: false,
        isInitialized: true,
      });
    } catch (e) {
      console.error('Error loading store data:', e);
      set({ isLoading: false, isInitialized: true });
    }
  },

  syncWithCloud: async (currentUser: User) => {
    if (!currentUser?.username) return;
    set({ isSyncing: true });
    try {
      const { purchases, payments, vendorInfo } = get();
      const timestamp = await CloudSyncService.pushCloudData(currentUser, purchases, payments, vendorInfo);
      set({ lastSyncedAt: timestamp, isSyncing: false });
    } catch (e) {
      set({ isSyncing: false });
    }
  },

  logPurchase: async (date, timeSlot, quantityInLiters, customPrice, status = 'received', notes = '', currentUser) => {
    const { purchases, calculatePrice, syncWithCloud } = get();
    const calculatedPrice = customPrice !== undefined ? customPrice : calculatePrice(quantityInLiters);

    const existingIndex = purchases.findIndex((p) => p.date === date && p.timeSlot === timeSlot);
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
    if (currentUser) {
      await syncWithCloud(currentUser);
    }
  },

  deletePurchase: async (id: string, currentUser) => {
    const { purchases, syncWithCloud } = get();
    const updated = purchases.filter((p) => p.id !== id);
    set({ purchases: updated });
    await StorageService.savePurchases(updated);
    if (currentUser) {
      await syncWithCloud(currentUser);
    }
  },

  updateVendorInfo: async (info: VendorInfo, currentUser) => {
    const { syncWithCloud } = get();
    set({ vendorInfo: info });
    await StorageService.saveVendorInfo(info);
    if (currentUser) {
      await syncWithCloud(currentUser);
    }
  },

  addPayment: async (date: string, amount: number, notes = '', currentUser) => {
    const { payments, syncWithCloud } = get();
    const newPayment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      date,
      amount,
      notes,
    };
    const updated = [newPayment, ...payments];
    set({ payments: updated });
    await StorageService.savePayments(updated);
    if (currentUser) {
      await syncWithCloud(currentUser);
    }
  },

  deletePayment: async (id: string, currentUser) => {
    const { payments, syncWithCloud } = get();
    const updated = payments.filter((p) => p.id !== id);
    set({ payments: updated });
    await StorageService.savePayments(updated);
    if (currentUser) {
      await syncWithCloud(currentUser);
    }
  },

  resetAllData: async () => {
    await StorageService.clearAllData();
    set({ purchases: [], payments: [], vendorInfo: DEFAULT_VENDOR, lastSyncedAt: null });
  },

  getEntryForSlot: (date: string, timeSlot: TimeSlot) => {
    return get().purchases.find((p) => p.date === date && p.timeSlot === timeSlot);
  },

  getMonthlySummary: (monthYear: string) => {
    const { purchases, payments } = get();

    // 1. Current Selected Month Deliveries & Payments
    const monthPurchases = purchases.filter((p) => p.date.startsWith(monthYear) && p.status === 'received');
    const totalLiters = monthPurchases.reduce((sum, p) => sum + p.quantityInLiters, 0);
    const totalCost = monthPurchases.reduce((sum, p) => sum + p.price, 0);

    const monthPayments = payments.filter((p) => p.date.startsWith(monthYear));
    const totalPaid = monthPayments.reduce((sum, p) => sum + p.amount, 0);

    // 2. All Historical Months Prior to Selected Month
    const priorPurchases = purchases.filter((p) => p.date < monthYear && p.status === 'received');
    const priorCost = priorPurchases.reduce((sum, p) => sum + p.price, 0);

    const priorPayments = payments.filter((p) => p.date < monthYear);
    const priorPaid = priorPayments.reduce((sum, p) => sum + p.amount, 0);

    const previousBalanceDue = priorCost - priorPaid;
    const balanceDue = totalCost - totalPaid;
    const totalBalanceDue = previousBalanceDue + balanceDue;

    return {
      monthYear,
      totalLiters: Number(totalLiters.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      totalPaid: Number(totalPaid.toFixed(2)),
      balanceDue: Number(balanceDue.toFixed(2)),
      previousBalanceDue: Number(previousBalanceDue.toFixed(2)),
      totalBalanceDue: Number(totalBalanceDue.toFixed(2)),
    };
  },
}));
