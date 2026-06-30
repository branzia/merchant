import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, Image, Animated,
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useDrawer } from '@/context/DrawerContext';
import * as api from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { statusColors, statColors, ui } from '@/config';

function SkeletonBox({ w, h, r = 8, style }: { w?: number | string; h: number; r?: number; style?: object }) {
  const anim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[{ backgroundColor: '#E5E7EB', borderRadius: r, height: h, width: w ?? '100%', opacity: anim }, style]}
    />
  );
}

function DashboardSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 14 }}>
      {/* Stat cards 2x2 */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {[0, 1].map(i => (
          <View key={i} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
            <SkeletonBox h={10} w={80} r={4} />
            <SkeletonBox h={28} w={60} r={6} style={{ marginTop: 10 }} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {[0, 1].map(i => (
          <View key={i} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
            <SkeletonBox h={10} w={80} r={4} />
            <SkeletonBox h={28} w={60} r={6} style={{ marginTop: 10 }} />
          </View>
        ))}
      </View>
      {/* Status bar */}
      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', gap: 8 }}>
        <SkeletonBox h={10} w={100} r={4} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          {[0, 1, 2, 3].map(i => <SkeletonBox key={i} h={40} r={10} style={{ flex: 1 }} />)}
        </View>
      </View>
      {/* Order rows */}
      <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden' }}>
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
          <SkeletonBox h={10} w={100} r={4} />
        </View>
        {[0, 1, 2].map(i => (
          <View key={i} style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F9FAFB', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonBox h={10} w={120} r={4} />
              <SkeletonBox h={8} w={80} r={4} />
            </View>
            <SkeletonBox h={20} w={50} r={10} />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const { merchant } = useAuth();
  const { openDrawer } = useDrawer();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const res = await api.getDashboard();
    if (res.status === 200) setData(res.data);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, []);

  const statusCounts = data?.status_counts ?? {};
  const recentOrders = data?.recent_orders ?? [];
  const sym = merchant?.currency_symbol ?? '';

  const STATS = [
    { label: "Today's Orders",  value: data?.orders_today ?? 0,             color: statColors.ordersToday,   icon: 'receipt-outline' as const },
    { label: "Today's Revenue", value: `${sym}${Number(data?.revenue_today ?? 0).toFixed(0)}`, color: statColors.revenueToday,  icon: 'cash-outline' as const },
    { label: 'Month Revenue',   value: `${sym}${Number(data?.revenue_month ?? 0).toFixed(0)}`, color: statColors.revenueMonth,  icon: 'trending-up-outline' as const },
    { label: 'Total Products',  value: data?.total_products ?? 0,            color: statColors.totalProducts, icon: 'bag-outline' as const },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-100 px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={openDrawer} activeOpacity={0.7}>
            {merchant?.logo ? (
              <Image source={{ uri: merchant.logo }} className="w-11 h-11 rounded-full" />
            ) : (
              <View className="w-11 h-11 rounded-full bg-indigo-100 items-center justify-center">
                <Text className="text-indigo-600 font-bold text-lg">
                  {(merchant?.shop_name ?? 'B')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xs text-gray-400">Welcome back,</Text>
            <Text className="font-bold text-gray-900 text-base" numberOfLines={1}>{merchant?.shop_name}</Text>
          </View>
          <View className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-full ${merchant?.is_open ? 'bg-green-100' : 'bg-red-100'}`}>
            <View className={`w-1.5 h-1.5 rounded-full ${merchant?.is_open ? 'bg-green-500' : 'bg-red-400'}`} />
            <Text className={`text-xs font-semibold ${merchant?.is_open ? 'text-green-700' : 'text-red-600'}`}>
              {merchant?.is_open ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui.accent} />}
      >
        {loading ? (
          <DashboardSkeleton />
        ) : (
          <View className="px-4 pt-4 gap-4">

            {/* Stat Cards — 2×2 */}
            <View className="flex-row flex-wrap gap-3">
              {STATS.map((stat) => (
                <View key={stat.label} className="flex-1 min-w-[44%] bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <View className="flex-row items-center gap-1.5 mb-2">
                    <Ionicons name={stat.icon} size={14} color="#9CA3AF" />
                    <Text className="text-xs text-gray-400 font-medium">{stat.label}</Text>
                  </View>
                  <Text className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</Text>
                </View>
              ))}
            </View>

            {/* Order Status Breakdown */}
            <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <Text className="px-4 py-3 font-semibold text-sm text-gray-900 border-b border-gray-100">Order Status</Text>
              <View className="flex-row">
                {(['pending', 'confirmed', 'delivered', 'rejected'] as const).map((s, i) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => router.push({ pathname: '/(tabs)/orders', params: { status: s } })}
                    className={`flex-1 items-center py-4 ${i < 3 ? 'border-r border-gray-100' : ''}`}
                    style={{ backgroundColor: statusColors[s].bg + '66' }}
                  >
                    <Text className="text-xl font-bold" style={{ color: statusColors[s].text }}>
                      {statusCounts[s] ?? 0}
                    </Text>
                    <Text className="text-[10px] text-gray-500 mt-0.5 capitalize font-medium">{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recent Orders */}
            {recentOrders.length > 0 && (
              <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                  <Text className="font-semibold text-sm text-gray-900">Recent Orders</Text>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
                    <Text className="text-indigo-600 text-xs font-semibold">View all →</Text>
                  </TouchableOpacity>
                </View>
                {recentOrders.map((order: any, i: number) => (
                  <TouchableOpacity
                    key={order.id}
                    onPress={() => router.push(`/orders/${order.id}`)}
                    className={`flex-row items-center gap-3 px-4 py-3 active:bg-gray-50 ${i < recentOrders.length - 1 ? 'border-b border-gray-50' : ''}`}
                  >
                    <View className="w-8 h-8 rounded-full bg-indigo-50 items-center justify-center shrink-0">
                      <Text className="text-indigo-600 font-bold text-xs">
                        {order.customer_name[0]?.toUpperCase() ?? '#'}
                      </Text>
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>{order.customer_name}</Text>
                      <Text className="text-xs text-gray-400 mt-0.5">#{order.id} · {order.order_type}</Text>
                    </View>
                    <View className="items-end gap-1">
                      <Text className="text-sm font-bold text-gray-900">{sym}{Number(order.total).toFixed(0)}</Text>
                      <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: statusColors[order.status]?.bg }}>
                        <Text className="text-[10px] font-semibold capitalize" style={{ color: statusColors[order.status]?.text }}>
                          {order.status}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Plan Banner */}
            {merchant?.subscription_plan && (
              <TouchableOpacity
                onPress={() => router.push('/subscription' as any)}
                className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3.5 flex-row items-center gap-3 mb-4"
              >
                <Ionicons name="sparkles-outline" size={18} color={ui.accent} />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                    {merchant.subscription_plan} plan
                  </Text>
                  {merchant.plan_days_remaining != null && (
                    <Text className="text-xs text-indigo-400 mt-0.5">
                      {merchant.plan_days_remaining > 0
                        ? `${merchant.plan_days_remaining} days remaining`
                        : 'Plan expired — tap to renew'}
                    </Text>
                  )}
                </View>
                <View className={`px-2.5 py-1 rounded-full ${merchant.plan_active ? 'bg-indigo-600' : 'bg-red-500'}`}>
                  <Text className="text-white text-xs font-semibold">
                    {merchant.plan_active ? 'Active' : 'Expired'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
