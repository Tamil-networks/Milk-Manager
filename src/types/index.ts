export type TimeSlot = 'morning' | 'evening';

export type DeliveryStatus = 'received' | 'skipped' | 'extra' | 'returned';

export interface PurchaseEntry {
  id: string;
  date: string; // ISO Format: YYYY-MM-DD
  timeSlot: TimeSlot;
  quantityInLiters: number;
  price: number; // Price calculated or custom
  status: DeliveryStatus;
  notes?: string;
}

export interface VendorInfo {
  vendorName: string;
  phone?: string;
  defaultMorningQty: number; // default e.g. 0.5 or 1.0
  defaultEveningQty: number; // default e.g. 0.5 or 1.0
  priceHalfLiter: number;    // Default: 25
  priceOneLiter: number;     // Default: 50
}

export interface PaymentRecord {
  id: string;
  date: string; // ISO Format: YYYY-MM-DD
  amount: number;
  notes?: string;
}

export interface MonthlyBillSummary {
  monthYear: string; // Format: YYYY-MM
  totalLiters: number;
  totalCost: number;
  totalPaid: number;
  balanceDue: number;
}
