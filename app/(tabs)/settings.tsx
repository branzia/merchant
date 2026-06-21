import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useDrawer } from '@/context/DrawerContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  autoCapitalize?: any;
}

function Field({ label, value, onChangeText, placeholder, keyboardType, multiline, autoCapitalize }: FieldProps) {
  return (
    <View>
      <Text className="text-sm font-medium text-gray-700 mb-1.5">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        className="w-full px-4 py-3.5 border border-gray-300 rounded-2xl text-sm text-gray-900 bg-white"
        style={multiline ? { textAlignVertical: 'top', minHeight: 80 } : {}}
      />
    </View>
  );
}

function LinkRow({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-4 border-b border-gray-50 active:bg-gray-50"
    >
      <Text className="text-xl">{emoji}</Text>
      <Text className="flex-1 text-sm font-medium text-gray-900">{label}</Text>
      <Text className="text-gray-400">›</Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { merchant, refreshMerchant, signOut } = useAuth();
  const { openDrawer } = useDrawer();

  const [shopName, setShopName] = useState(merchant?.shop_name ?? '');
  const [dialCode, setDialCode] = useState(merchant?.dial_code ?? '');
  const [phone, setPhone] = useState(merchant?.phone ?? '');
  const [description, setDescription] = useState(merchant?.description ?? '');
  const [address, setAddress] = useState(merchant?.address ?? '');
  const [pickupAddress, setPickupAddress] = useState(merchant?.pickup_address ?? '');
  const [instagram, setInstagram] = useState(merchant?.instagram_handle ?? '');
  const [facebook, setFacebook] = useState(merchant?.facebook_url ?? '');
  const [youtube, setYoutube] = useState(merchant?.youtube_url ?? '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await api.getSettings();
    if (res.status === 200) {
      const m = res.data.merchant ?? res.data;
      setShopName(m.shop_name ?? '');
      setDialCode(m.dial_code ?? '');
      setPhone(m.phone ?? '');
      setDescription(m.description ?? '');
      setAddress(m.address ?? '');
      setPickupAddress(m.pickup_address ?? '');
      setInstagram(m.instagram_handle ?? '');
      setFacebook(m.facebook_url ?? '');
      setYoutube(m.youtube_url ?? '');
      refreshMerchant(m);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!shopName.trim()) {
      Alert.alert('Required', 'Shop name is required.');
      return;
    }
    setSaving(true);
    const payload: Record<string, unknown> = {
      shop_name: shopName.trim(),
    };
    if (dialCode.trim()) payload.dial_code = dialCode.trim();
    if (phone.trim()) payload.phone = phone.trim();
    if (description.trim()) payload.description = description.trim();
    if (address.trim()) payload.address = address.trim();
    if (pickupAddress.trim()) payload.pickup_address = pickupAddress.trim();
    if (instagram.trim()) payload.instagram_handle = instagram.trim();
    if (facebook.trim()) payload.facebook_url = facebook.trim();
    if (youtube.trim()) payload.youtube_url = youtube.trim();

    const res = await api.updateSettings(payload);
    setSaving(false);

    if (res.status === 200) {
      const m = res.data.merchant ?? res.data;
      refreshMerchant(m);
      Alert.alert('Saved', 'Settings updated successfully.');
    } else {
      Alert.alert('Error', res.data?.message ?? 'Failed to save settings.');
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
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white border-b border-gray-100 px-4 pt-4 pb-3 flex-row items-center gap-3">
        <TouchableOpacity onPress={openDrawer} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text className="text-2xl text-gray-400">☰</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="px-4 py-4 gap-5">

          {/* Quick Links */}
          <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <LinkRow emoji="💳" label="Payment Methods" onPress={() => router.push('/settings/payment-methods' as any)} />
            <LinkRow emoji="🚚" label="Delivery Settings" onPress={() => router.push('/settings/delivery' as any)} />
            <LinkRow emoji="🕐" label="Business Hours" onPress={() => router.push('/settings/hours' as any)} />
            <LinkRow emoji="🖼️" label="Logo Upload" onPress={() => router.push('/settings/logo' as any)} />
          </View>

          {/* Shop Info */}
          <View className="gap-4">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Shop Info</Text>
            <Field label="Shop Name *" value={shopName} onChangeText={setShopName} placeholder="Your shop name" />
            <Field label="Description" value={description} onChangeText={setDescription} placeholder="Describe your shop..." multiline />
            <Field label="Address" value={address} onChangeText={setAddress} placeholder="Full address" />
          </View>

          {/* Contact */}
          <View className="gap-4">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</Text>

            {/* Phone with separate dial code */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Phone Number</Text>
              <View className="flex-row gap-2">
                <View className="flex-row items-center border border-gray-300 rounded-2xl bg-white px-3" style={{ width: 80 }}>
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

          {/* Social Links */}
          <View className="gap-4">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Social Links</Text>
            <Field
              label="Instagram Handle"
              value={instagram}
              onChangeText={setInstagram}
              placeholder="yourshop"
              autoCapitalize="none"
            />
            <Field
              label="Facebook URL / Username"
              value={facebook}
              onChangeText={setFacebook}
              placeholder="yourshop"
              autoCapitalize="none"
            />
            <Field
              label="YouTube Channel / Handle"
              value={youtube}
              onChangeText={setYoutube}
              placeholder="@yourshop"
              autoCapitalize="none"
            />
          </View>

          {/* Save */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-indigo-600 rounded-2xl py-4 items-center"
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Save Settings</Text>
            )}
          </TouchableOpacity>

          {/* Subscription Plan */}
          {merchant?.subscription_plan && (
            <View className="rounded-2xl overflow-hidden border border-indigo-100"
              style={{ backgroundColor: '#EEF2FF' }}
            >
              {/* Plan header */}
              <View className="px-4 pt-4 pb-3 flex-row items-start justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 flex-wrap">
                    <Text className="text-base font-bold text-indigo-900 capitalize">
                      {merchant.subscription_plan} Plan
                    </Text>
                    <View
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: merchant.plan_active ? '#D1FAE5' : '#FEE2E2' }}
                    >
                      <Text
                        className="text-[10px] font-bold uppercase"
                        style={{ color: merchant.plan_active ? '#065F46' : '#991B1B' }}
                      >
                        {merchant.plan_active ? 'Active' : 'Expired'}
                      </Text>
                    </View>
                  </View>

                  {merchant.plan_days_remaining != null && (
                    <Text className="text-xs text-indigo-500 mt-1">
                      {merchant.plan_days_remaining > 0
                        ? `${merchant.plan_days_remaining} days remaining`
                        : 'Plan expired — renew to keep your store live'}
                    </Text>
                  )}
                </View>
              </View>

              {/* Plan limits info */}
              <View className="mx-4 mb-3 bg-white/60 rounded-xl px-3 py-2.5 flex-row gap-4">
                {[
                  { label: 'Currency', value: merchant.currency ?? '—' },
                  { label: 'Store', value: merchant.slug ? `branzia.app/${merchant.slug}` : '—' },
                ].map(({ label, value }) => (
                  <View key={label} className="flex-1">
                    <Text className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wide">{label}</Text>
                    <Text className="text-xs text-indigo-800 font-medium mt-0.5" numberOfLines={1}>{value}</Text>
                  </View>
                ))}
              </View>

              {/* Upgrade button */}
              <TouchableOpacity
                onPress={() => router.push('/subscription' as any)}
                activeOpacity={0.8}
                className="mx-4 mb-4 bg-indigo-600 rounded-xl py-3.5 items-center flex-row justify-center gap-2"
              >
                <Text className="text-white font-semibold text-sm">Upgrade Plan</Text>
                <Text className="text-indigo-200 text-sm">›</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Logout */}
          <TouchableOpacity
            onPress={() => Alert.alert('Logout', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: signOut },
            ])}
            className="bg-red-50 border border-red-200 rounded-2xl py-4 items-center mb-6"
          >
            <Text className="text-red-600 font-semibold text-base">Logout</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
