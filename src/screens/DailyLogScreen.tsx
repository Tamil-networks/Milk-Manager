import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Header } from '../components/Header';
import { CustomLogModal } from '../components/CustomLogModal';
import { useMilkStore } from '../store/useMilkStore';
import { TimeSlot, PurchaseEntry } from '../types';

export const DailyLogScreen: React.FC = () => {
  const { purchases, getEntryForSlot } = useMilkStore();

  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7)
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>('morning');
  const [activeEntry, setActiveEntry] = useState<PurchaseEntry | undefined>();

  // Generate list of days for selectedMonth (e.g. 1 to 30/31)
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = (i + 1).toString().padStart(2, '0');
    return `${selectedMonth}-${dayNum}`;
  }).reverse(); // Most recent day first

  const openLogModal = (date: string, slot: TimeSlot) => {
    setSelectedDate(date);
    setSelectedSlot(slot);
    setActiveEntry(getEntryForSlot(date, slot));
    setModalVisible(true);
  };

  const renderDayItem = ({ item: date }: { item: string }) => {
    const morning = getEntryForSlot(date, 'morning');
    const evening = getEntryForSlot(date, 'evening');

    const dayObj = new Date(date);
    const dayName = dayObj.toLocaleDateString('en-US', { weekday: 'short' });
    const formattedDay = dayObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
      <View style={styles.dayCard}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle}>{formattedDay}</Text>
          <Text style={styles.daySub}>{dayName}</Text>
        </View>

        <View style={styles.slotsContainer}>
          {/* Morning Slot */}
          <TouchableOpacity
            style={[
              styles.slotBox,
              morning?.status === 'received' && styles.slotReceived,
              morning?.status === 'skipped' && styles.slotSkipped,
            ]}
            onPress={() => openLogModal(date, 'morning')}
          >
            <Text style={styles.slotLabel}>☀️ Morning</Text>
            <Text style={styles.slotValue}>
              {morning
                ? morning.status === 'skipped'
                  ? 'Skipped'
                  : `${morning.quantityInLiters}L (₹${morning.price})`
                : '+ Log'}
            </Text>
          </TouchableOpacity>

          {/* Evening Slot */}
          <TouchableOpacity
            style={[
              styles.slotBox,
              evening?.status === 'received' && styles.slotReceived,
              evening?.status === 'skipped' && styles.slotSkipped,
            ]}
            onPress={() => openLogModal(date, 'evening')}
          >
            <Text style={styles.slotLabel}>🌙 Evening</Text>
            <Text style={styles.slotValue}>
              {evening
                ? evening.status === 'skipped'
                  ? 'Skipped'
                  : `${evening.quantityInLiters}L (₹${evening.price})`
                : '+ Log'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="📅 Daily Milk Log" subtitle="Tap any slot to log or edit entries" />

      <View style={styles.container}>
        {/* Month Selector Bar */}
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

        {/* Days List */}
        <FlatList
          data={daysArray}
          keyExtractor={(item) => item}
          renderItem={renderDayItem}
          contentContainerStyle={styles.listContent}
        />
      </View>

      <CustomLogModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        date={selectedDate}
        timeSlot={selectedSlot}
        existingEntry={activeEntry}
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
    flex: 1,
  },
  monthBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  navArrow: {
    fontSize: 18,
    color: '#0284C7',
    paddingHorizontal: 10,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayHeader: {
    width: 80,
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  daySub: {
    fontSize: 12,
    color: '#64748B',
  },
  slotsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  slotBox: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  slotReceived: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  slotSkipped: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  slotLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  slotValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 4,
  },
});
