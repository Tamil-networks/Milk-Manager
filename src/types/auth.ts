export interface User {
  id: string;
  username: string;
  createdAt: string;
  lastSyncedAt?: string;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface CloudAccountData {
  user: User;
  purchases: any[];
  payments: any[];
  vendorInfo: any;
  updatedAt: string;
}
