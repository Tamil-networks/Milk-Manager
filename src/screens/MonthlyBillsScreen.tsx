import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { Header } from '../components/Header';
import { PaymentModal } from '../components/PaymentModal';
import { useMilkStore } from '../store/useMilkStore';

export const MonthlyBillsScreen: React.FC = () => {
  const { purchases, payments, deletePayment, getMonthlySummary } = useMilkStore();

  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7)
  );

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const summary = getMonthlySummary(selectedMonth);

  // Filter items for selected month
  const monthPurchases = purchases.filter((p) => p.date.startsWith(selectedMonth));
  const monthPayments = payments.filter((p) => p.date.startsWith(selectedMonth));

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="🧾 Monthly Milk Bills" subtitle="Track expenses, payments & balance due" />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Month Navigation */}
        <View style={styles.monthBar}>
          <TouchableOpacity
            onPress={() => {
              const prevMonth = new Date(year, month - 2, 1)
                .toISOString()
                .substring(0, 7);
              setSelectedMonth(prevMonth);
            }}
          >
            <Text style={styles.navArrow}>◀</Text>
          </TouchableOpacity>

          <Text style={styles.monthTitle}>
            {new Date(year, month - 1, 1).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>

          <TouchableOpacity
            onPress={() => {
              const nextMonth = new Date(year, month, 1)
                .toISOString()
                .substring(0, 7);
              setSelectedMonth(nextMonth);
            }}
          >
            <Text style={styles.navArrow}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Bill Summary Statement */}
        <View style={styles.statementCard}>
          <Text style={styles.statementTitle}>Monthly Bill Statement</Text>

          {summary.previousBalanceDue > 0 ? (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Previous Carried Balance:</Text>
              <Text style={[styles.rowValue, styles.dueRed]}>+ ₹{summary.previousBalanceDue}</Text>
            </View>
          ) : null}

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Total Liters Bought:</Text>
            <Text style={styles.rowValue}>{summary.totalLiters} Liters</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>This Month's Bill:</Text>
            <Text style={styles.rowValue}>₹{summary.totalCost}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Paid This Month:</Text>
            <Text style={[styles.rowValue, styles.paidText]}>- ₹{summary.totalPaid}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.dueLabel}>Total Outstanding Due:</Text>
            <Text
              style={[
                styles.dueValue,
                summary.totalBalanceDue > 0 ? styles.dueRed : styles.dueGreen,
              ]}
            >
              ₹{summary.totalBalanceDue}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.payBtn}
            onPress={() => setPaymentModalVisible(true)}
          >
            <Text style={styles.payBtnText}>+ Log Payment Paid</Text>
          </TouchableOpacity>
        </View>

        {/* Payment History List */}
        <Text style={styles.sectionHeader}>Payments Logged ({monthPayments.length})</Text>
        {monthPayments.length === 0 ? (
          <Text style={styles.emptyText}>No payments recorded for this month.</Text>
        ) : (
          monthPayments.map((item) => (
            <View key={item.id} style={styles.paymentCard}>
              <View>
                <Text style={styles.paymentAmount}>₹{item.amount}</Text>
                <Text style={styles.paymentDate}>Paid on: {item.date}</Text>
                {item.notes ? <Text style={styles.paymentNotes}>{item.notes}</Text> : null}
              </View>
              <TouchableOpacity
                style={styles.deletePaymentBtn}
                onPress={() => deletePayment(item.id)}
              >
                <Text style={styles.deletePaymentText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Itemized Deliveries Breakdown */}
        <Text style={styles.sectionHeader}>
          Daily Delivery Records ({monthPurchases.length})
        </Text>
        {monthPurchases.length === 0 ? (
          <Text style={styles.emptyText}>No milk deliveries recorded this month.</Text>
        ) : (
          monthPurchases.map((item) => (
            <View key={item.id} style={styles.logRow}>
              <View>
                <Text style={styles.logDate}>
                  {item.date} ({item.timeSlot === 'morning' ? '☀️ Morning' : '🌙 Evening'})
                </Text>
                <Text style={styles.logSub}>
                  {item.status === 'skipped'
                    ? 'SKIPPED'
                    : `${item.quantityInLiters} Liters @ ₹${item.price}`}
                </Text>
              </View>
              <Text
                style={[
                  styles.logAmount,
                  item.status === 'skipped' && styles.skippedText,
                ]}
              >
                {item.status === 'skipped' ? '₹0' : `₹${item.price}`}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

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
  monthBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navArrow: {
    fontSize: 18,
    color: '#0284C7',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  statementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rowLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  paidText: {
    color: '#16A34A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  dueLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  dueValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dueRed: {
    color: '#DC2626',
  },
  dueGreen: {
    color: '#16A34A',
  },
  payBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 10,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginBottom: 14,
  },
  paymentCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
  },
  paymentDate: {
    fontSize: 12,
    color: '#15803D',
  },
  paymentNotes: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
    marginTop: 2,
  },
  deletePaymentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  deletePaymentText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  logRow: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  logSub: {
    fontSize: 12,
    color: '#64748B',
  },
  logAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0284C7',
  },
  skippedText: {
    color: '#94A3B8',
  },
});
