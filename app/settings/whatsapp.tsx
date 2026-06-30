import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { ui } from '@/config';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomTabBar from '@/components/BottomTabBar';

export default function WhatsAppScreen() {
  const router = useRouter();
  const { merchant, refreshMerchant } = useAuth();

  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!merchant) return;
    setEnabled(merchant.whatsapp_enabled ?? false);
    setMessage(merchant.whatsapp_message ?? '');
  }, [merchant]);

  const handleSave = async () => {
    setSaving(true);
    const payload: Record<string, unknown> = { whatsapp_enabled: enabled };
    if (enabled && message.trim()) payload.whatsapp_message = message.trim();

    const res = await api.updateSettings(payload);
    if (res.status === 200) {
      const meRes = await api.getMe();
      if (meRes.status === 200) refreshMerchant(meRes.data.merchant);
      Alert.alert('Saved', 'WhatsApp settings updated.');
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
        <Text className="font-semibold text-base text-gray-900">WhatsApp</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="px-4 py-4 gap-4">
          <Text className="text-xs text-gray-500">
            When enabled, a WhatsApp button appears on your store so buyers can message you directly.
          </Text>

          <View className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-sm font-medium text-gray-900">Enable WhatsApp Button</Text>
              <Text className="text-xs text-gray-500 mt-0.5">Show chat button on your store for buyers</Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: '#D1D5DB', true: ui.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          {enabled && (
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Pre-filled Message</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Hi, I'd like to place an order!"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                className="w-full px-4 py-3.5 border border-gray-300 rounded-2xl text-sm text-gray-900 bg-white"
                style={{ textAlignVertical: 'top', minHeight: 80 }}
              />
              <Text className="text-xs text-gray-400 mt-1">
                This text will be pre-filled when a buyer taps the WhatsApp button.
              </Text>
            </View>
          )}

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
