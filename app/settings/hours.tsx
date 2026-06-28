import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Switch, Alert, ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as api from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomTabBar from '@/components/BottomTabBar';

const DAY_NAMES: Record<string, string> = {
  '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday', '4': 'Thursday',
  '5': 'Friday', '6': 'Saturday', '7': 'Sunday',
};

type DayHours = { open: string | null; close: string | null; closed: boolean };
type Hours = Record<string, DayHours>;

export default function BusinessHoursScreen() {
  const router = useRouter();
  const [hours, setHours] = useState<Hours>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings().then((res) => {
      if (res.status === 200) {
        const m = res.data.merchant ?? res.data;
        const bh = m.business_hours ?? {};
        const defaultHours: Hours = {};
        for (let d = 1; d <= 7; d++) {
          const key = String(d);
          defaultHours[key] = bh[key] ?? { open: '09:00', close: '21:00', closed: false };
        }
        setHours(defaultHours);
      }
      setLoading(false);
    });
  }, []);

  const update = (day: string, field: keyof DayHours, value: any) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await api.updateHours(hours as Record<string, unknown>);
    setSaving(false);
    if (res.status === 200) {
      Alert.alert('Saved', 'Business hours updated.');
    } else {
      Alert.alert('Error', res.data?.message ?? 'Failed to update hours.');
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
                    trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
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
    </SafeAreaView>
  );
}
