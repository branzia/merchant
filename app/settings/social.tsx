import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomTabBar from '@/components/BottomTabBar';

function Field({ label, value, onChangeText, placeholder, autoCapitalize }: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; autoCapitalize?: any;
}) {
  return (
    <View>
      <Text className="text-sm font-medium text-gray-700 mb-1.5">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        autoCapitalize={autoCapitalize ?? 'sentences'}
        className="w-full px-4 py-3.5 border border-gray-300 rounded-2xl text-sm text-gray-900 bg-white"
      />
    </View>
  );
}

export default function SocialScreen() {
  const router = useRouter();
  const { merchant, refreshMerchant } = useAuth();

  const [dialCode, setDialCode] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [youtube, setYoutube] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!merchant) return;
    setDialCode(merchant.dial_code ?? '');
    setPhone(merchant.phone ?? '');
    setInstagram(merchant.instagram_handle ?? '');
    setFacebook(merchant.facebook_url ?? '');
    setYoutube(merchant.youtube_url ?? '');
  }, [merchant]);

  const handleSave = async () => {
    setSaving(true);
    const payload: Record<string, unknown> = {};
    if (dialCode.trim()) payload.dial_code = dialCode.trim();
    if (phone.trim()) payload.phone = phone.trim();
    if (instagram.trim()) payload.instagram_handle = instagram.trim();
    if (facebook.trim()) payload.facebook_url = facebook.trim();
    if (youtube.trim()) payload.youtube_url = youtube.trim();

    const res = await api.updateSettings(payload);
    if (res.status === 200) {
      const meRes = await api.getMe();
      if (meRes.status === 200) refreshMerchant(meRes.data.merchant);
      Alert.alert('Saved', 'Contact & social links updated.');
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
        <Text className="font-semibold text-base text-gray-900">Contact & Social</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="px-4 py-4 gap-5">

          <View className="gap-4">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</Text>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Phone Number</Text>
              <View className="flex-row gap-2">
                <View
                  className="flex-row items-center border border-gray-300 rounded-2xl bg-white px-3"
                  style={{ width: 80 }}
                >
                  <Text className="text-gray-500 text-sm">+</Text>
                  <TextInput
                    value={dialCode}
                    onChangeText={setDialCode}
                    placeholder="91"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={5}
                    className="flex-1 py-3.5 text-sm text-gray-900"
                  />
                </View>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="9876543210"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  className="flex-1 px-4 py-3.5 border border-gray-300 rounded-2xl text-sm text-gray-900 bg-white"
                />
              </View>
              <Text className="text-xs text-gray-400 mt-1">Dial code (e.g. 91) + number</Text>
            </View>
          </View>

          <View className="gap-4">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Social Links</Text>
            <Field label="Instagram Handle" value={instagram} onChangeText={setInstagram} placeholder="yourshop" autoCapitalize="none" />
            <Field label="Facebook URL / Username" value={facebook} onChangeText={setFacebook} placeholder="yourshop" autoCapitalize="none" />
            <Field label="YouTube Channel / Handle" value={youtube} onChangeText={setYoutube} placeholder="@yourshop" autoCapitalize="none" />
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-indigo-600 rounded-2xl py-4 items-center mb-6"
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
