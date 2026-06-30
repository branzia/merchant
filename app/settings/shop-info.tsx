import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomTabBar from '@/components/BottomTabBar';

function Field({ label, value, onChangeText, placeholder, multiline, required }: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; multiline?: boolean; required?: boolean;
}) {
  return (
    <View>
      <Text className="text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <Text className="text-red-500"> *</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        className="w-full px-4 py-3.5 border border-gray-300 rounded-2xl text-sm text-gray-900 bg-white"
        style={multiline ? { textAlignVertical: 'top', minHeight: 80 } : {}}
      />
    </View>
  );
}

export default function ShopInfoScreen() {
  const router = useRouter();
  const { merchant, refreshMerchant } = useAuth();

  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!merchant) return;
    setShopName(merchant.shop_name ?? '');
    setDescription(merchant.description ?? '');
    setAddress(merchant.address ?? '');
    setPickupAddress(merchant.pickup_address ?? '');
  }, [merchant]);

  const handleSave = async () => {
    if (!shopName.trim()) {
      Alert.alert('Required', 'Shop name is required.');
      return;
    }
    setSaving(true);
    const payload: Record<string, unknown> = { shop_name: shopName.trim() };
    if (description.trim()) payload.description = description.trim();
    if (address.trim()) payload.address = address.trim();
    if (pickupAddress.trim()) payload.pickup_address = pickupAddress.trim();

    const res = await api.updateSettings(payload);
    if (res.status === 200) {
      const meRes = await api.getMe();
      if (meRes.status === 200) refreshMerchant(meRes.data.merchant);
      Alert.alert('Saved', 'Shop info updated.');
    } else {
      Alert.alert('Error', res.data?.message ?? 'Failed to save.');
    }
    setSaving(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <View className="bg-white border-b border-gray-100 px-4 py-3 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.push('/(tabs)/settings' as any)} className="p-1 -ml-1">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="font-semibold text-base text-gray-900">Shop Info</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="px-4 py-4 gap-4">
          <Field label="Shop Name" value={shopName} onChangeText={setShopName} placeholder="Your shop name" required />
          <Field label="Description" value={description} onChangeText={setDescription} placeholder="Describe your shop..." multiline />
          <Field label="Address" value={address} onChangeText={setAddress} placeholder="Full address" />
          <Field label="Pickup Address" value={pickupAddress} onChangeText={setPickupAddress} placeholder="Shop No 5, MG Road" multiline />

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-indigo-600 rounded-2xl py-4 items-center mt-2 mb-6"
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving
              ? <ActivityIndicator color="white" />
              : <Text className="text-white font-semibold text-base">Save</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomTabBar activeTab="settings" />
    </SafeAreaView>
  );
}
