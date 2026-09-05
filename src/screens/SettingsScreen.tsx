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
} from 'react-native';
import { Header } from '../components/Header';
import { useMilkStore } from '../store/useMilkStore';

export const SettingsScreen: React.FC = () => {
  const { vendorInfo, updateVendorInfo, resetAllData } = useMilkStore();

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
    });

    Alert.alert('Settings Saved', 'Default rates and vendor info updated successfully.');
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
            Alert.alert('Reset Complete', 'All offline data cleared.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="⚙️ Settings & Rates" subtitle="Configure default prices and vendor info" />

      <ScrollView contentContainerStyle={styles.container}>
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

        {/* Storage & Privacy Info */}
        <View style={styles.offlineBox}>
          <Text style={styles.offlineTitle}>🔒 100% Offline & Private</Text>
          <Text style={styles.offlineText}>
            All your daily milk logs, rates, and payments are stored locally on your device using AsyncStorage. No cloud servers or internet required.
          </Text>
        </View>

        {/* Reset Data Danger Zone */}
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={handleResetData}>
            <Text style={styles.resetBtnText}>Clear All Offline Data</Text>
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
  offlineBox: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  offlineTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0369A1',
    marginBottom: 4,
  },
  offlineText: {
    fontSize: 12,
    color: '#0284C7',
    lineHeight: 18,
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
