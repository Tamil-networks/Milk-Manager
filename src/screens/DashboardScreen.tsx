import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Header } from '../components/Header';
import { CustomLogModal } from '../components/CustomLogModal';
import { PaymentModal } from '../components/PaymentModal';
import { useMilkStore } from '../store/useMilkStore';
import { TimeSlot, PurchaseEntry } from '../types';

export const DashboardScreen: React.FC = () => {
  const {
    logPurchase,
    getEntryForSlot,
    getMonthlySummary,
    vendorInfo,
    loadStore,
    isLoading,
  } = useMilkStore();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>('morning');
  const [activeEntry, setActiveEntry] = useState<PurchaseEntry | undefined>();

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthYear = todayStr.substring(0, 7);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Store is initialized at root App.tsx level

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStore();
    setRefreshing(false);
  };

  const morningEntry = getEntryForSlot(todayStr, 'morning');
  const eveningEntry = getEntryForSlot(todayStr, 'evening');
  const monthlySummary = getMonthlySummary(currentMonthYear);

  const handleQuickLog = async (slot: TimeSlot, qty: number) => {
    const price = qty === 0.5 ? vendorInfo.priceHalfLiter : vendorInfo.priceOneLiter;
    await logPurchase(todayStr, slot, qty, price, 'received');
  };

  const openCustomModal = (slot: TimeSlot, entry?: PurchaseEntry) => {
    setSelectedSlot(slot);
    setActiveEntry(entry);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="🥛 Milk Buyer Dashboard" subtitle={formattedDate} />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing || isLoading} onRefresh={onRefresh} />
        }
      >
        {/* Monthly Expense Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>
            Current Month Expense ({new Date().toLocaleDateString('en-US', { month: 'long' })})
          </Text>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{monthlySummary.totalLiters} L</Text>
              <Text style={styles.summaryLabel}>Total Liters</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>₹{monthlySummary.totalCost}</Text>
              <Text style={styles.summaryLabel}>Total Bill</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text
                style={[
                  styles.summaryValue,
                  monthlySummary.balanceDue > 0 ? styles.dueText : styles.paidText,
                ]}
              >
                ₹{monthlySummary.balanceDue}
              </Text>
              <Text style={styles.summaryLabel}>Balance Due</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.payBtn}
            onPress={() => setPaymentModalVisible(true)}
          >
            <Text style={styles.payBtnText}>+ Record Payment to Milkman</Text>
          </TouchableOpacity>
        </View>

        {/* 1-Tap Quick Action Log Cards */}
        <Text style={styles.sectionHeader}>Today's Milk Deliveries</Text>

        {/* Morning Slot */}
        <View style={styles.slotCard}>
          <View style={styles.slotHeader}>
            <Text style={styles.slotTitle}>☀️ Morning Delivery</Text>
            {morningEntry ? (
              <View
                style={[
                  styles.badge,
                  morningEntry.status === 'received'
                    ? styles.badgeReceived
                    : styles.badgeSkipped,
                ]}
              >
                <Text style={styles.badgeText}>
                  {morningEntry.status === 'received'
                    ? `${morningEntry.quantityInLiters}L (₹${morningEntry.price})`
                    : 'SKIPPED'}
                </Text>
              </View>
            ) : (
              <Text style={styles.pendingText}>Not Logged Yet</Text>
            )}
          </View>

          <Text style={styles.quickLabel}>1-Tap Quick Log:</Text>
          <View style={styles.quickBtnRow}>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => handleQuickLog('morning', 0.5)}
            >
              <Text style={styles.quickBtnTitle}>½ Liter</Text>
              <Text style={styles.quickBtnPrice}>₹{vendorInfo.priceHalfLiter}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => handleQuickLog('morning', 1.0)}
            >
              <Text style={styles.quickBtnTitle}>1 Liter</Text>
              <Text style={styles.quickBtnPrice}>₹{vendorInfo.priceOneLiter}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.customBtn}
              onPress={() => openCustomModal('morning', morningEntry)}
            >
              <Text style={styles.customBtnText}>
                {morningEntry ? 'Edit' : 'Custom'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Evening Slot */}
        <View style={styles.slotCard}>
          <View style={styles.slotHeader}>
            <Text style={styles.slotTitle}>🌙 Evening Delivery</Text>
            {eveningEntry ? (
              <View
                style={[
                  styles.badge,
                  eveningEntry.status === 'received'
                    ? styles.badgeReceived
                    : styles.badgeSkipped,
                ]}
              >
                <Text style={styles.badgeText}>
                  {eveningEntry.status === 'received'
                    ? `${eveningEntry.quantityInLiters}L (₹${eveningEntry.price})`
                    : 'SKIPPED'}
                </Text>
              </View>
            ) : (
              <Text style={styles.pendingText}>Not Logged Yet</Text>
            )}
          </View>

          <Text style={styles.quickLabel}>1-Tap Quick Log:</Text>
          <View style={styles.quickBtnRow}>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => handleQuickLog('evening', 0.5)}
            >
              <Text style={styles.quickBtnTitle}>½ Liter</Text>
              <Text style={styles.quickBtnPrice}>₹{vendorInfo.priceHalfLiter}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => handleQuickLog('evening', 1.0)}
            >
              <Text style={styles.quickBtnTitle}>1 Liter</Text>
              <Text style={styles.quickBtnPrice}>₹{vendorInfo.priceOneLiter}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.customBtn}
              onPress={() => openCustomModal('evening', eveningEntry)}
            >
              <Text style={styles.customBtnText}>
                {eveningEntry ? 'Edit' : 'Custom'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Milkman Profile Summary */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📌 Milkman Details</Text>
          <Text style={styles.infoText}>Supplier: {vendorInfo.vendorName}</Text>
          {vendorInfo.phone ? (
            <Text style={styles.infoText}>Contact: {vendorInfo.phone}</Text>
          ) : null}
          <Text style={styles.infoText}>
            Rates: ½ L = ₹{vendorInfo.priceHalfLiter} | 1 L = ₹{vendorInfo.priceOneLiter}
          </Text>
        </View>
      </ScrollView>

      {/* Log Modal */}
      <CustomLogModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        date={todayStr}
        timeSlot={selectedSlot}
        existingEntry={activeEntry}
      />

      {/* Payment Modal */}
      <PaymentModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
      />
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0284C7',
  },
  dueText: {
    color: '#D97706',
  },
  paidText: {
    color: '#16A34A',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  payBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  payBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  slotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  slotTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  pendingText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeReceived: {
    backgroundColor: '#DCFCE7',
  },
  badgeSkipped: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#15803D',
  },
  quickLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  quickBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  quickBtnTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0369A1',
  },
  quickBtnPrice: {
    fontSize: 12,
    color: '#0284C7',
  },
  customBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  infoBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#78350F',
    marginTop: 2,
  },
});
