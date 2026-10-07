import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Header } from '../components/Header';
import { useMilkStore } from '../store/useMilkStore';
import { useAuthStore } from '../store/useAuthStore';

export const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuthStore();
  const {
    vendorInfo,
    updateVendorInfo,
    resetAllData,
    syncWithCloud,
    isSyncing,
    lastSyncedAt,
  } = useMilkStore();

  const [name, setName] = useState(vendorInfo.vendorName);
  const [phone, setPhone] = useState(vendorInfo.phone || '');
  const [halfPrice, setHalfPrice] = useState(vendorInfo.priceHalfLiter.toString());
  const [onePrice, setOnePrice] = useState(vendorInfo.priceOneLiter.toString());

  const handleSaveSettings = async () => {
    const parsedHalf = parseFloat(halfPrice);
    const parsedOne = parseFloat(onePrice);

    if (isNaN(parsedHalf) || parsedHalf <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price for ½ Liter.');
      return;
    }

    if (isNaN(parsedOne) || parsedOne <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price for 1 Liter.');
      return;
    }

    await updateVendorInfo({
      ...vendorInfo,
      vendorName: name.trim() || 'Local Milkman',
      phone: phone.trim(),
      priceHalfLiter: parsedHalf,
      priceOneLiter: parsedOne,
    }, user);

    Alert.alert('Settings Saved', 'Default rates and vendor info updated successfully.');
  };

  const handleManualSync = async () => {
    if (!user) return;
    await syncWithCloud(user);
    Alert.alert('Cloud Sync Complete', 'All your milk logs and settings are backed up to your account.');
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleResetData = () => {
    Alert.alert(
      'Clear All Data?',
      'This will permanently delete all purchase logs and payment history stored on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All Data',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            setName('Local Milkman');
            setPhone('');
            setHalfPrice('25');
            setOnePrice('50');
            Alert.alert('Reset Complete', 'All local data cleared.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="⚙️ Settings & Account" subtitle="Configure default prices, vendor & account sync" />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Active User Account Section */}
        <View style={styles.userCard}>
          <View style={styles.userHeaderRow}>
            <View>
              <Text style={styles.userRoleLabel}>Active Account</Text>
              <Text style={styles.usernameText}>@{user?.username || 'Guest'}</Text>
              {lastSyncedAt ? (
                <Text style={styles.syncStatusText}>
                  Last Synced: {new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              ) : (
                <Text style={styles.syncStatusText}>Cross-Device Cloud Sync Enabled</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.syncBtn}
              onPress={handleManualSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator color="#0284C7" size="small" />
              ) : (
                <Text style={styles.syncBtnText}>🔄 Sync Now</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Sign Out of Account</Text>
          </TouchableOpacity>
        </View>

        {/* Price Configuration Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>💰 Default Base Prices</Text>
          <Text style={styles.sectionSub}>
            Set default prices for quick 1-tap logging. (Can be customized per entry).
          </Text>

          <View style={styles.fieldRow}>
            <View style={styles.halfField}>
              <Text style={styles.label}>½ Liter Price (₹)</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={halfPrice}
                onChangeText={setHalfPrice}
              />
            </View>

            <View style={styles.halfField}>
              <Text style={styles.label}>1 Liter Price (₹)</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={onePrice}
                onChangeText={setOnePrice}
              />
            </View>
          </View>
        </View>

        {/* Milkman / Supplier Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>👤 Milk Supplier Details</Text>

          <Text style={styles.label}>Milkman / Dairy Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Ramesh Milkman / Mother Dairy"
          />

          <Text style={styles.label}>Contact Phone (Optional)</Text>
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 9876543210"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings}>
          <Text style={styles.saveBtnText}>Save Preferences</Text>
        </TouchableOpacity>

        {/* Reset Data Danger Zone */}
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={handleResetData}>
            <Text style={styles.resetBtnText}>Clear Local Offline Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 16,
    paddingBottom: 30,
  },
  userCard: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  userHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userRoleLabel: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '600',
  },
  usernameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  syncStatusText: {
    fontSize: 12,
    color: '#0284C7',
    marginTop: 2,
  },
  syncBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  syncBtnText: {
    color: '#0369A1',
    fontWeight: 'bold',
    fontSize: 13,
  },
  logoutBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 13,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
  },
  saveBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dangerCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 16,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#991B1B',
    marginBottom: 10,
  },
  resetBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
