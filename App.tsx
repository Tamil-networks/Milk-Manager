import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/useAuthStore';
import { useMilkStore } from './src/store/useMilkStore';

export default function App() {
  const { checkAuthSession, isLoading: isAuthLoading, user } = useAuthStore();
  const { loadStore, isLoading: isStoreLoading } = useMilkStore();

  useEffect(() => {
    const initializeApp = async () => {
      await checkAuthSession();
    };
    initializeApp();
  }, []);

  useEffect(() => {
    if (!isAuthLoading) {
      loadStore(user);
    }
  }, [isAuthLoading, user]);

  if (isAuthLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Initializing Account & Milk Manager...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="#0284C7" />
      <RootNavigator />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
});
