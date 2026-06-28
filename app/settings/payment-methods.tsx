import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Switch, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as api from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomTabBar from '@/components/BottomTabBar';

interface PaymentData {
  cod: { enabled: boolean };
  upi: { enabled: boolean; upi_id: string | null };
  bank_transfer: {
    enabled: boolean;
    account_name: string | null;
    account_number: string | null;
    ifsc: string | null;
    bank_name: string | null;
  };
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <View className="px-4 py-3 border-b border-gray-50 flex-row items-center gap-2">
        <Text className="text-sm font-semibold text-gray-900">{title}</Text>
      </View>
      <View className="px-4 py-4 gap-4">{children}</View>
    </View>
  );
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [data, setData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // COD
  const [codEnabled, setCodEnabled] = useState(false);
  const [savingCod, setSavingCod] = useState(false);

  // UPI
  const [upiEnabled, setUpiEnabled] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [savingUpi, setSavingUpi] = useState(false);

  // Bank Transfer
  const [bankEnabled, setBankEnabled] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [savingBank, setSavingBank] = useState(false);

  const populate = (d: PaymentData) => {
    setData(d);
    setCodEnabled(d.cod.enabled);
    setUpiEnabled(d.upi.enabled);
    setUpiId(d.upi.upi_id ?? '');
    setBankEnabled(d.bank_transfer.enabled);
    setAccountName(d.bank_transfer.account_name ?? '');
    setAccountNumber(d.bank_transfer.account_number ?? '');
    setIfsc(d.bank_transfer.ifsc ?? '');
    setBankName(d.bank_transfer.bank_name ?? '');
  };

  const load = async () => {
    const res = await api.getPaymentMethods();
    if (res.status === 200) populate(res.data.data);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, []);

  const saveCod = async () => {
    setSavingCod(true);
    const res = await api.updateCod(codEnabled);
    setSavingCod(false);
    if (res.status === 200) {
      Alert.alert('Saved', 'Cash on Delivery updated.');
    } else {
      Alert.alert('Error', res.data?.message ?? 'Failed to update COD.');
    }
  };

  const saveUpi = async () => {
    if (upiEnabled && !upiId.trim()) {
      Alert.alert('Required', 'UPI ID is required when UPI is enabled.');
      return;
    }
    setSavingUpi(true);
    const res = await api.updateUpi(upiEnabled, upiEnabled ? upiId.trim() : undefined);
    setSavingUpi(false);
    if (res.status === 200) {
      Alert.alert('Saved', 'UPI settings updated.');
    } else {
      Alert.alert('Error', res.data?.message ?? 'Failed to update UPI.');
    }
  };

  const saveBank = async () => {
    if (bankEnabled && !accountNumber.trim()) {
      Alert.alert('Required', 'Account number is required when bank transfer is enabled.');
      return;
    }
    setSavingBank(true);
    const res = await api.updateBankTransfer(bankEnabled, bankEnabled ? {
      account_name: accountName.trim() || undefined,
      account_number: accountNumber.trim(),
      ifsc: ifsc.trim() || undefined,
      bank_name: bankName.trim() || undefined,
    } : undefined);
    setSavingBank(false);
    if (res.status === 200) {
      Alert.alert('Saved', 'Bank transfer settings updated.');
    } else {
      Alert.alert('Error', res.data?.message ?? 'Failed to update bank transfer.');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <View className="bg-white border-b border-gray-100 px-4 py-3 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="font-semibold text-base text-gray-900">Payment Methods</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 py-4 gap-4">

          {/* Cash on Delivery */}
          <SectionCard title="💵  Cash on Delivery">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-medium text-gray-900">Enable COD</Text>
                <Text className="text-xs text-gray-500 mt-0.5">Buyer pays cash at delivery</Text>
              </View>
              <Switch
                value={codEnabled}
                onValueChange={setCodEnabled}
                trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <TouchableOpacity
              onPress={saveCod}
              disabled={savingCod}
              className="bg-indigo-600 rounded-2xl py-3.5 items-center"
              style={{ opacity: savingCod ? 0.7 : 1 }}
            >
              {savingCod ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-semibold text-sm">Save COD</Text>
              )}
            </TouchableOpacity>
          </SectionCard>

          {/* UPI */}
          <SectionCard title="📲  UPI Payment">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-medium text-gray-900">Enable UPI</Text>
                <Text className="text-xs text-gray-500 mt-0.5">Buyer pays via UPI app</Text>
              </View>
              <Switch
                value={upiEnabled}
                onValueChange={setUpiEnabled}
                trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
                thumbColor="#FFFFFF"
              />
            </View>
            {upiEnabled && (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1.5">UPI ID <Text className="text-red-500">*</Text></Text>
                <TextInput
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder="yourname@upi"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="border border-gray-300 rounded-2xl px-4 py-3.5 text-sm text-gray-900 bg-white"
                />
              </View>
            )}
            <TouchableOpacity
              onPress={saveUpi}
              disabled={savingUpi}
              className="bg-indigo-600 rounded-2xl py-3.5 items-center"
              style={{ opacity: savingUpi ? 0.7 : 1 }}
            >
              {savingUpi ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-semibold text-sm">Save UPI</Text>
              )}
            </TouchableOpacity>
          </SectionCard>

          {/* Bank Transfer */}
          <SectionCard title="🏦  Bank Transfer">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-medium text-gray-900">Enable Bank Transfer</Text>
                <Text className="text-xs text-gray-500 mt-0.5">Buyer transfers directly to bank</Text>
              </View>
              <Switch
                value={bankEnabled}
                onValueChange={setBankEnabled}
                trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
                thumbColor="#FFFFFF"
              />
            </View>
            {bankEnabled && (
              <View className="gap-3">
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1.5">Account Number <Text className="text-red-500">*</Text></Text>
                  <TextInput
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    placeholder="1234567890"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    className="border border-gray-300 rounded-2xl px-4 py-3.5 text-sm text-gray-900 bg-white"
                  />
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1.5">Account Holder Name</Text>
                  <TextInput
                    value={accountName}
                    onChangeText={setAccountName}
                    placeholder="Full name"
                    placeholderTextColor="#9CA3AF"
                    className="border border-gray-300 rounded-2xl px-4 py-3.5 text-sm text-gray-900 bg-white"
                  />
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1.5">IFSC Code</Text>
                  <TextInput
                    value={ifsc}
                    onChangeText={setIfsc}
                    placeholder="SBIN0001234"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    className="border border-gray-300 rounded-2xl px-4 py-3.5 text-sm text-gray-900 bg-white"
                  />
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1.5">Bank Name</Text>
                  <TextInput
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder="State Bank of India"
                    placeholderTextColor="#9CA3AF"
                    className="border border-gray-300 rounded-2xl px-4 py-3.5 text-sm text-gray-900 bg-white"
                  />
                </View>
              </View>
            )}
            <TouchableOpacity
              onPress={saveBank}
              disabled={savingBank}
              className="bg-indigo-600 rounded-2xl py-3.5 items-center"
              style={{ opacity: savingBank ? 0.7 : 1 }}
            >
              {savingBank ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-semibold text-sm">Save Bank Transfer</Text>
              )}
            </TouchableOpacity>
          </SectionCard>

        </View>
      </ScrollView>

      <BottomTabBar activeTab="settings" />
    </SafeAreaView>
  );
}
