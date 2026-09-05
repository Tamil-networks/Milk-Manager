import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { TimeSlot, DeliveryStatus, PurchaseEntry } from '../types';
import { useMilkStore } from '../store/useMilkStore';

interface CustomLogModalProps {
  visible: boolean;
  onClose: () => void;
  date: string;
  timeSlot: TimeSlot;
  existingEntry?: PurchaseEntry;
}

export const CustomLogModal: React.FC<CustomLogModalProps> = ({
  visible,
  onClose,
  date,
  timeSlot,
  existingEntry,
}) => {
  const { logPurchase, deletePurchase, vendorInfo, calculatePrice } = useMilkStore();

  const [qty, setQty] = useState<string>('0.5');
  const [price, setPrice] = useState<string>('25');
  const [status, setStatus] = useState<DeliveryStatus>('received');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (existingEntry) {
      setQty(existingEntry.quantityInLiters.toString());
      setPrice(existingEntry.price.toString());
      setStatus(existingEntry.status);
      setNotes(existingEntry.notes || '');
    } else {
      setQty('0.5');
      setPrice(vendorInfo.priceHalfLiter.toString());
      setStatus('received');
      setNotes('');
    }
  }, [existingEntry, visible, vendorInfo]);

  const handleQtyChange = (val: string) => {
    setQty(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const calculated = calculatePrice(num);
      setPrice(calculated.toString());
    }
  };

  const handleSave = async () => {
    const parsedQty = parseFloat(qty);
    const parsedPrice = parseFloat(price);

    if (isNaN(parsedQty) || parsedQty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity in liters.');
      return;
    }

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price amount.');
      return;
    }

    await logPurchase(date, timeSlot, parsedQty, parsedPrice, status, notes);
    onClose();
  };

  const handleDelete = async () => {
    if (existingEntry) {
      await deletePurchase(existingEntry.id);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.headerTitle}>
              {timeSlot === 'morning' ? '☀️ Morning' : '🌙 Evening'} Milk Entry
            </Text>
            <Text style={styles.dateSubtitle}>Date: {date}</Text>

            {/* Quick Presets */}
            <Text style={styles.label}>Quick Presets</Text>
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={[
                  styles.presetBtn,
                  qty === '0.5' && price === vendorInfo.priceHalfLiter.toString() && styles.activePreset,
                ]}
                onPress={() => {
                  setQty('0.5');
                  setPrice(vendorInfo.priceHalfLiter.toString());
                  setStatus('received');
                }}
              >
                <Text style={styles.presetTitle}>½ Liter</Text>
                <Text style={styles.presetSub}>₹{vendorInfo.priceHalfLiter}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetBtn,
                  qty === '1' && price === vendorInfo.priceOneLiter.toString() && styles.activePreset,
                ]}
                onPress={() => {
                  setQty('1.0');
                  setPrice(vendorInfo.priceOneLiter.toString());
                  setStatus('received');
                }}
              >
                <Text style={styles.presetTitle}>1 Liter</Text>
                <Text style={styles.presetSub}>₹{vendorInfo.priceOneLiter}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetBtn,
                  status === 'skipped' && styles.activePreset,
                ]}
                onPress={() => {
                  setQty('0');
                  setPrice('0');
                  setStatus('skipped');
                }}
              >
                <Text style={styles.presetTitle}>Skipped</Text>
                <Text style={styles.presetSub}>₹0</Text>
              </TouchableOpacity>
            </View>

            {/* Custom Input */}
            <View style={styles.fieldRow}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Quantity (Liters)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={qty}
                  onChangeText={handleQtyChange}
                  placeholder="e.g. 0.5 or 1.5"
                />
              </View>

              <View style={styles.halfField}>
                <Text style={styles.label}>Total Price (₹)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={price}
                  onChangeText={setPrice}
                  placeholder="e.g. 25 or 50"
                />
              </View>
            </View>

            {/* Status Picker */}
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusRow}>
              {(['received', 'skipped', 'extra', 'returned'] as DeliveryStatus[]).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.statusChip,
                    status === st && styles.activeStatusChip,
                  ]}
                  onPress={() => setStatus(st)}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      status === st && styles.activeStatusChipText,
                    ]}
                  >
                    {st.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g., Guest arrived, took extra 0.5L"
              multiline
            />

            {/* Action Buttons */}
            <View style={styles.btnRow}>
              {existingEntry ? (
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  content: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  dateSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  presetBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  activePreset: {
    borderColor: '#0284C7',
    backgroundColor: '#E0F2FE',
  },
  presetTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0369A1',
  },
  presetSub: {
    fontSize: 12,
    color: '#0284C7',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },
  notesInput: {
    height: 70,
    textAlignVertical: 'top',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeStatusChip: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  activeStatusChipText: {
    color: '#FFFFFF',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '600',
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#0284C7',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  deleteBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    marginRight: 'auto',
  },
  deleteBtnText: {
    color: '#EF4444',
    fontWeight: '600',
  },
});
