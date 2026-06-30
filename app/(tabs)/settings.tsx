import {
  View, Text, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useDrawer } from '@/context/DrawerContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { app } from '@/config';

function LinkRow({ emoji, label, onPress, isLast }: {
  emoji: string; label: string; onPress: () => void; isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center gap-3 px-4 py-4 active:bg-gray-50${!isLast ? ' border-b border-gray-100' : ''}`}
    >
      <Text className="text-xl">{emoji}</Text>
      <Text className="flex-1 text-sm font-medium text-gray-900">{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { merchant, signOut } = useAuth();
  const { openDrawer } = useDrawer();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <View className="bg-white border-b border-gray-100 px-4 pt-4 pb-3 flex-row items-center gap-3">
        <TouchableOpacity onPress={openDrawer} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="menu-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 py-4 gap-4">

          {/* Store */}
          <View>
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Store</Text>
            <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <LinkRow emoji="🏪" label="Shop Info" onPress={() => router.push('/settings/shop-info' as any)} />
              <LinkRow emoji="📱" label="Contact & Social" onPress={() => router.push('/settings/social' as any)} />
              <LinkRow emoji="💬" label="WhatsApp" onPress={() => router.push('/settings/whatsapp' as any)} />
              <LinkRow emoji="🖼️" label="Logo" onPress={() => router.push('/settings/logo' as any)} isLast />
            </View>
          </View>

          {/* Operations */}
          <View>
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Operations</Text>
            <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <LinkRow emoji="💳" label="Payment Methods" onPress={() => router.push('/settings/payment-methods' as any)} />
              <LinkRow emoji="🚚" label="Delivery Settings" onPress={() => router.push('/settings/delivery' as any)} />
              <LinkRow emoji="🕐" label="Business Hours" onPress={() => router.push('/settings/hours' as any)} isLast />
            </View>
          </View>

          {/* Subscription Plan */}
          {app.features.billing && merchant?.subscription_plan && (
            <View className="rounded-2xl overflow-hidden border border-indigo-100" style={{ backgroundColor: '#EEF2FF' }}>
              <View className="px-4 pt-4 pb-3 flex-row items-start justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 flex-wrap">
                    <Text className="text-base font-bold text-indigo-700 capitalize">
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
                    <Text className="text-xs text-indigo-400 mt-1">
                      {merchant.plan_days_remaining > 0
                        ? `${merchant.plan_days_remaining} days remaining`
                        : 'Plan expired — renew to keep your store live'}
                    </Text>
                  )}
                </View>
              </View>

              <View className="mx-4 mb-3 bg-white/60 rounded-xl px-3 py-2.5 flex-row gap-4">
                {[
                  { label: 'Currency', value: merchant.currency ?? '—' },
                  { label: 'Store', value: merchant.slug ? `branzia.app/store/${merchant.slug}` : '—' },
                ].map(({ label, value }) => (
                  <View key={label} className="flex-1">
                    <Text className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wide">{label}</Text>
                    <Text className="text-xs text-indigo-800 font-medium mt-0.5" numberOfLines={1}>{value}</Text>
                  </View>
                ))}
              </View>

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
