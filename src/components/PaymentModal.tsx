import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useMilkStore } from '../store/useMilkStore';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  defaultMonthYear?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ visible, onClose }) => {
  const { addPayment } = useMilkStore();
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState<string>(todayStr);
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    await addPayment(date, parsedAmount, notes);
    setAmount('');
    setNotes('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>💸 Log Payment to Milkman</Text>
          <Text style={styles.subTitle}>Record payment paid towards your milk bill</Text>

          <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />

          <Text style={styles.label}>Amount Paid (₹)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            placeholder="e.g. 500 or 1500"
          />

          <Text style={styles.label}>Payment Note / Reference (Optional)</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Paid via UPI / Cash"
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subTitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
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
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '600',
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#16A34A',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
