import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Switch, Alert, ActivityIndicator, Modal, FlatList, Dimensions,
} from 'react-native';
import { ui } from '@/config';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import * as api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomTabBar from '@/components/BottomTabBar';

const DAY_NAMES: Record<string, string> = {
  '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday', '4': 'Thursday',
  '5': 'Friday', '6': 'Saturday', '7': 'Sunday',
};

const TIMEZONES = [
  { value: 'Asia/Kolkata',          label: 'India (IST)' },
  { value: 'America/New_York',      label: 'US Eastern (ET)' },
  { value: 'America/Chicago',       label: 'US Central (CT)' },
  { value: 'America/Denver',        label: 'US Mountain (MT)' },
  { value: 'America/Los_Angeles',   label: 'US Pacific (PT)' },
  { value: 'Europe/London',         label: 'United Kingdom (GMT/BST)' },
  { value: 'America/Toronto',       label: 'Canada Eastern (ET)' },
  { value: 'America/Winnipeg',      label: 'Canada Central (CT)' },
  { value: 'America/Edmonton',      label: 'Canada Mountain (MT)' },
  { value: 'America/Vancouver',     label: 'Canada Pacific (PT)' },
  { value: 'Australia/Sydney',      label: 'Australia Eastern (AEST)' },
  { value: 'Australia/Brisbane',    label: 'Australia Eastern, no DST (AEST)' },
  { value: 'Australia/Adelaide',    label: 'Australia Central (ACST)' },
  { value: 'Australia/Perth',       label: 'Australia Western (AWST)' },
  { value: 'Asia/Dubai',            label: 'UAE (GST)' },
  { value: 'Asia/Singapore',        label: 'Singapore (SGT)' },
  { value: 'Pacific/Auckland',      label: 'New Zealand (NZST/NZDT)' },
  { value: 'Europe/Berlin',         label: 'Germany (CET)' },
  { value: 'Europe/Paris',          label: 'France (CET)' },
];

type DayHours = { open: string | null; close: string | null; closed: boolean };
type Hours = Record<string, DayHours>;

export default function BusinessHoursScreen() {
  const router = useRouter();
  const { merchant, refreshMerchant } = useAuth();
  const [hours, setHours] = useState<Hours>({});
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tzModal, setTzModal] = useState(false);
  const [tzSearch, setTzSearch] = useState('');

  useEffect(() => {
    const bh = merchant?.business_hours ?? {};
    const defaultHours: Hours = {};
    for (let d = 1; d <= 7; d++) {
      const key = String(d);
      defaultHours[key] = bh[key] ?? { open: '09:00', close: '21:00', closed: false };
    }
    setHours(defaultHours);
    if (merchant?.timezone) setTimezone(merchant.timezone);
    setLoading(false);
  }, []);

  const filteredTimezones = useMemo(() => {
    const q = tzSearch.toLowerCase();
    return q ? TIMEZONES.filter(tz => tz.label.toLowerCase().includes(q) || tz.value.toLowerCase().includes(q)) : TIMEZONES;
  }, [tzSearch]);

  const tzLabel = TIMEZONES.find(tz => tz.value === timezone)?.label ?? timezone;

  const update = (day: string, field: keyof DayHours, value: any) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await api.updateHours(hours as Record<string, unknown>, timezone.trim());
    setSaving(false);
    if (res.status === 200) {
      if (merchant) {
        refreshMerchant({
          ...merchant,
          business_hours: res.data.business_hours,
          timezone: res.data.timezone ?? timezone.trim(),
          is_open: res.data.is_open,
        });
      }
      Alert.alert('Saved', 'Business hours updated.');
    } else {
      Alert.alert('Error', res.data?.message ?? 'Failed to update hours.');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color={ui.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <View className="bg-white border-b border-gray-100 px-4 py-3 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.push('/(tabs)/settings' as any)} className="p-1 -ml-1">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="font-semibold text-base text-gray-900">Business Hours</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 py-4 gap-3">
          <Text className="text-xs text-gray-500">Set your store hours for each day of the week.</Text>

          {Object.entries(hours).map(([day, dh]) => (
            <View
              key={day}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4"
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text className="font-semibold text-gray-900">{DAY_NAMES[day]}</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm text-gray-500">{dh.closed ? 'Closed' : 'Open'}</Text>
                  <Switch
                    value={!dh.closed}
                    onValueChange={(v) => update(day, 'closed', !v)}
                    trackColor={{ false: '#D1D5DB', true: ui.accent }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              {!dh.closed && (
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">Opens at</Text>
                    <TextInput
                      value={dh.open ?? ''}
                      onChangeText={(v) => update(day, 'open', v)}
                      placeholder="09:00"
                      placeholderTextColor="#9CA3AF"
                      className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-gray-50"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">Closes at</Text>
                    <TextInput
                      value={dh.close ?? ''}
                      onChangeText={(v) => update(day, 'close', v)}
                      placeholder="21:00"
                      placeholderTextColor="#9CA3AF"
                      className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-gray-50"
                    />
                  </View>
                </View>
              )}
            </View>
          ))}

          {/* Timezone picker */}
          <View className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 gap-2">
            <Text className="font-semibold text-gray-900">Timezone</Text>
            <TouchableOpacity
              onPress={() => { setTzSearch(''); setTzModal(true); }}
              className="flex-row items-center justify-between border border-gray-200 rounded-xl px-3 py-3 bg-gray-50"
            >
              <Text className="text-sm text-gray-900 flex-1" numberOfLines={1}>{tzLabel}</Text>
              <Text className="text-gray-400 text-xs ml-2">▼</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-indigo-600 rounded-2xl py-4 items-center mb-6"
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Save Hours</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomTabBar activeTab="settings" />

      {/* Timezone Modal */}
      <Modal visible={tzModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            height: Dimensions.get('window').height * 0.72,
          }}>
            {/* Header */}
            <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827' }}>Select Timezone</Text>
                <TouchableOpacity onPress={() => setTzModal(false)}>
                  <Text style={{ color: '#9CA3AF', fontSize: 18 }}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, gap: 8 }}>
                <Text style={{ color: '#9CA3AF' }}>🔍</Text>
                <TextInput
                  value={tzSearch}
                  onChangeText={setTzSearch}
                  placeholder="Search timezone..."
                  placeholderTextColor="#9CA3AF"
                  autoFocus
                  style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: '#111827' }}
                />
              </View>
            </View>

            {/* List */}
            <FlatList
              data={filteredTimezones}
              keyExtractor={item => item.value}
              keyboardShouldPersistTaps="handled"
              style={{ flex: 1 }}
              renderItem={({ item }) => {
                const selected = item.value === timezone;
                return (
                  <TouchableOpacity
                    onPress={() => { setTimezone(item.value); setTzModal(false); }}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      paddingHorizontal: 20, paddingVertical: 14,
                      borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
                      backgroundColor: selected ? '#EEF2FF' : '#fff',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: selected ? '#4338CA' : '#111827' }}>{item.label}</Text>
                      <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{item.value}</Text>
                    </View>
                    {selected && <Text style={{ color: '#4F46E5', fontSize: 16, marginLeft: 12 }}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
