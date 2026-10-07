import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, PurchaseEntry, PaymentRecord, VendorInfo, CloudAccountData } from '../types';

const API_BASE_URL = 'https://api.restful-api.dev/objects';
const MASTER_DIR_ID = 'ff808181a09d98f701a10a620cda79b6';
const CLOUD_ID_KEY_PREFIX = '@milk_cloud_obj_id_';

export const CloudSyncService = {
  getCloudIdKey(username: string): string {
    return `${CLOUD_ID_KEY_PREFIX}${username.toLowerCase()}`;
  },

  async getLocalCloudObjectId(username: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.getCloudIdKey(username));
    } catch (e) {
      return null;
    }
  },

  async setLocalCloudObjectId(username: string, cloudId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.getCloudIdKey(username), cloudId);
    } catch (e) {
      console.error('Error saving local cloud ID mapping', e);
    }
  },

  /**
   * Fetch Master User Directory from online cloud API
   */
  async getMasterDirectory(): Promise<Record<string, string>> {
    try {
      const res = await fetch(`${API_BASE_URL}/${MASTER_DIR_ID}`);
      if (res.ok) {
        const item = await res.json();
        return item?.data?.users || {};
      }
    } catch (e) {
      console.error('Error fetching master cloud directory', e);
    }
    return {};
  },

  /**
   * Update Master User Directory with new username -> cloudObjectId mapping
   */
  async updateMasterDirectory(username: string, cloudId: string): Promise<void> {
    try {
      const users = await this.getMasterDirectory();
      users[username.toLowerCase()] = cloudId;

      await fetch(`${API_BASE_URL}/${MASTER_DIR_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'milk_manager_global_dir_v1',
          data: { users },
        }),
      });
    } catch (e) {
      console.error('Error updating master cloud directory', e);
    }
  },

  /**
   * Fetch online account data by username across ANY device in the world
   */
  async fetchCloudAccountByUsername(username: string): Promise<{ cloudId: string; accountData: any } | null> {
    const cleanUsername = username.toLowerCase();

    // 1. Check local cache first for fast load
    const cachedId = await this.getLocalCloudObjectId(cleanUsername);
    if (cachedId) {
      try {
        const res = await fetch(`${API_BASE_URL}/${cachedId}`);
        if (res.ok) {
          const item = await res.json();
          if (item && item.data && item.data.username === cleanUsername) {
            return { cloudId: item.id, accountData: item.data };
          }
        }
      } catch (e) {
        console.warn('Cached cloud lookup failed, fallback to Master Directory query', e);
      }
    }

    // 2. Query Master Global Directory across devices
    const masterUsers = await this.getMasterDirectory();
    const targetCloudId = masterUsers[cleanUsername];

    if (targetCloudId) {
      try {
        const res = await fetch(`${API_BASE_URL}/${targetCloudId}`);
        if (res.ok) {
          const item = await res.json();
          if (item && item.data) {
            await this.setLocalCloudObjectId(cleanUsername, targetCloudId);
            return { cloudId: targetCloudId, accountData: item.data };
          }
        }
      } catch (e) {
        console.error('Error fetching user object from Master Directory reference', e);
      }
    }

    return null;
  },

  /**
   * Create new cloud account record online and register in Master Directory
   */
  async createCloudAccount(username: string, passwordHash: string, initialData: Partial<CloudAccountData>): Promise<string> {
    const cleanUsername = username.toLowerCase();
    const targetName = `milk_acc_${cleanUsername}`;
    const payload = {
      name: targetName,
      data: {
        username: cleanUsername,
        password: passwordHash,
        purchases: initialData.purchases || [],
        payments: initialData.payments || [],
        vendorInfo: initialData.vendorInfo || null,
        updatedAt: new Date().toISOString(),
      },
    };

    try {
      const res = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to create online account record.');
      }

      const createdObj = await res.json();
      const cloudId = createdObj.id;

      // Save locally and register in global directory
      await this.setLocalCloudObjectId(cleanUsername, cloudId);
      await this.updateMasterDirectory(cleanUsername, cloudId);

      return cloudId;
    } catch (e) {
      console.error('Error creating online cloud account', e);
      throw e;
    }
  },

  /**
   * Push latest purchases, payments & settings to global online cloud
   */
  async pushCloudData(
    user: User,
    purchases: PurchaseEntry[],
    payments: PaymentRecord[],
    vendorInfo: VendorInfo
  ): Promise<string> {
    const username = user.username.toLowerCase();
    const now = new Date().toISOString();

    let cloudInfo = await this.fetchCloudAccountByUsername(username);

    const updatedData = {
      username,
      password: cloudInfo?.accountData?.password || '1234',
      purchases,
      payments,
      vendorInfo,
      updatedAt: now,
    };

    try {
      if (cloudInfo?.cloudId) {
        await fetch(`${API_BASE_URL}/${cloudInfo.cloudId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `milk_acc_${username}`,
            data: updatedData,
          }),
        });
      } else {
        await this.createCloudAccount(username, '1234', { purchases, payments, vendorInfo });
      }

      return now;
    } catch (e) {
      console.error('Error pushing data to cloud', e);
      return now;
    }
  },

  /**
   * Pull latest data from online cloud for cross-device sync
   */
  async pullCloudData(username: string): Promise<CloudAccountData | null> {
    try {
      const cloudInfo = await this.fetchCloudAccountByUsername(username);
      if (!cloudInfo || !cloudInfo.accountData) return null;

      const data = cloudInfo.accountData;
      return {
        user: { id: `usr_${username}`, username, createdAt: data.updatedAt || new Date().toISOString() },
        purchases: data.purchases || [],
        payments: data.payments || [],
        vendorInfo: data.vendorInfo || null,
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    } catch (e) {
      console.error('Error pulling cloud data', e);
      return null;
    }
  },
};
