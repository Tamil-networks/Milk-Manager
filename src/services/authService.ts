import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthCredentials } from '../types';
import { CloudSyncService } from './cloudSyncService';
import { DEFAULT_VENDOR } from '../storage/asyncStorageService';

const KEYS = {
  ACTIVE_USER: '@milk_manager_active_user',
  USERS_DB: '@milk_manager_users_db',
};

interface StoredUserAccount {
  user: User;
  passwordHash: string;
}

export const AuthService = {
  async getActiveUser(): Promise<User | null> {
    try {
      const json = await AsyncStorage.getItem(KEYS.ACTIVE_USER);
      return json ? JSON.parse(json) : null;
    } catch (e) {
      console.error('Error fetching active user session', e);
      return null;
    }
  },

  async register({ username, password }: AuthCredentials): Promise<User> {
    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername || !password) {
      throw new Error('Username and Password are required.');
    }

    if (password.length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }

    // 1. Check if account already exists globally in Cloud DB
    const existingCloudAccount = await CloudSyncService.fetchCloudAccountByUsername(trimmedUsername);
    if (existingCloudAccount && existingCloudAccount.accountData) {
      throw new Error(`Username "${trimmedUsername}" is already taken. Please sign in or pick another username.`);
    }

    // 2. Also check local AsyncStorage DB fallback
    const usersDb = await this.getUsersDb();
    if (usersDb[trimmedUsername]) {
      throw new Error(`Username "${trimmedUsername}" is already taken.`);
    }

    const newUser: User = {
      id: `usr_${trimmedUsername}`,
      username: trimmedUsername,
      createdAt: new Date().toISOString(),
    };

    // 3. Create global online cloud account record
    try {
      await CloudSyncService.createCloudAccount(trimmedUsername, password, {
        purchases: [],
        payments: [],
        vendorInfo: DEFAULT_VENDOR,
      });
    } catch (e) {
      console.warn('Could not store credentials to global cloud, proceeding locally', e);
    }

    // 4. Store user in local device cache
    usersDb[trimmedUsername] = {
      user: newUser,
      passwordHash: password,
    };

    await AsyncStorage.setItem(KEYS.USERS_DB, JSON.stringify(usersDb));
    await AsyncStorage.setItem(KEYS.ACTIVE_USER, JSON.stringify(newUser));

    return newUser;
  },

  async login({ username, password }: AuthCredentials): Promise<User> {
    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername || !password) {
      throw new Error('Please enter both Username and Password.');
    }

    // 1. Query online global cloud database for user account across devices
    const cloudRecord = await CloudSyncService.fetchCloudAccountByUsername(trimmedUsername);

    if (cloudRecord && cloudRecord.accountData) {
      const cloudPassword = cloudRecord.accountData.password;
      if (cloudPassword !== password) {
        throw new Error('Incorrect Password. Please try again.');
      }

      const loggedInUser: User = {
        id: `usr_${trimmedUsername}`,
        username: trimmedUsername,
        createdAt: cloudRecord.accountData.updatedAt || new Date().toISOString(),
      };

      // Update local credentials cache
      const usersDb = await this.getUsersDb();
      usersDb[trimmedUsername] = {
        user: loggedInUser,
        passwordHash: password,
      };
      await AsyncStorage.setItem(KEYS.USERS_DB, JSON.stringify(usersDb));
      await AsyncStorage.setItem(KEYS.ACTIVE_USER, JSON.stringify(loggedInUser));

      return loggedInUser;
    }

    // 2. Fallback check local device AsyncStorage
    const usersDb = await this.getUsersDb();
    const localAccount = usersDb[trimmedUsername];

    if (localAccount) {
      if (localAccount.passwordHash !== password) {
        throw new Error('Incorrect Password. Please try again.');
      }

      await AsyncStorage.setItem(KEYS.ACTIVE_USER, JSON.stringify(localAccount.user));

      // Attempt to push local user account to cloud for future cross-device access
      try {
        await CloudSyncService.createCloudAccount(trimmedUsername, password, {});
      } catch (e) {
        // ignore offline error
      }

      return localAccount.user;
    }

    throw new Error(`Account "${trimmedUsername}" not found. Please verify username or click Create Account.`);
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.ACTIVE_USER);
  },

  async getUsersDb(): Promise<Record<string, StoredUserAccount>> {
    try {
      const json = await AsyncStorage.getItem(KEYS.USERS_DB);
      return json ? JSON.parse(json) : {};
    } catch (e) {
      return {};
    }
  },
};
