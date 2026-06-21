import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useDrawer } from '@/context/DrawerContext';
import * as api from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:   { bg: '#FEF3C7', text: '#92400E' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF' },
  delivered: { bg: '#D1FAE5', text: '#065F46' },
  rejected:  { bg: '#FEE2E2', text: '#991B1B' },
};

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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const statusCounts = data?.status_counts ?? {};
  const recentOrders = data?.recent_orders ?? [];
  const currencySymbol = merchant?.currency_symbol ?? '';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2 bg-white border-b border-gray-100">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={openDrawer} activeOpacity={0.7}>
              {merchant?.logo ? (
                <Image
                  source={{ uri: merchant.logo }}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <View className="w-12 h-12 rounded-full bg-indigo-100 items-center justify-center">
                  <Text className="text-indigo-600 font-bold text-xl">
                    {(merchant?.shop_name ?? 'B')[0].toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-xs text-gray-500">Welcome back,</Text>
              <Text className="font-semibold text-gray-900 text-base">{merchant?.shop_name}</Text>
            </View>
            <View
              className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full ${merchant?.is_open ? 'bg-green-100' : 'bg-red-100'}`}
            >
              <View className={`w-1.5 h-1.5 rounded-full ${merchant?.is_open ? 'bg-green-500' : 'bg-red-500'}`} />
              <Text className={`text-xs font-medium ${merchant?.is_open ? 'text-green-700' : 'text-red-700'}`}>
                {merchant?.is_open ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-4 pt-4 gap-4">

          {/* Stats Grid */}
          <View className="flex-row flex-wrap gap-3">
            {[
              { label: "Today's Orders", value: data?.orders_today ?? 0, color: 'text-gray-900' },
              { label: "Today's Revenue", value: `${currencySymbol}${Number(data?.revenue_today ?? 0).toFixed(0)}`, color: 'text-indigo-600' },
              { label: 'This Month', value: `${currencySymbol}${Number(data?.revenue_month ?? 0).toFixed(0)}`, color: 'text-green-600' },
              { label: 'Total Products', value: data?.total_products ?? 0, color: 'text-gray-900' },
            ].map((stat) => (
              <View key={stat.label} className="flex-1 min-w-[44%] bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <Text className="text-xs text-gray-500 font-medium">{stat.label}</Text>
                <Text className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</Text>
              </View>
            ))}
          </View>

          {/* Order Status Breakdown */}
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <Text className="px-4 py-3 font-semibold text-sm text-gray-900 border-b border-gray-100">Order Status</Text>
            <View className="flex-row">
              {(['pending','confirmed','delivered','rejected'] as const).map((s, i) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => router.push({ pathname: '/(tabs)/orders', params: { status: s } })}
                  className={`flex-1 items-center py-4 ${i < 3 ? 'border-r border-gray-100' : ''}`}
                  style={{ backgroundColor: STATUS_COLORS[s].bg + '55' }}
                >
                  <Text className="text-2xl font-bold" style={{ color: STATUS_COLORS[s].text }}>
                    {statusCounts[s] ?? 0}
                  </Text>
                  <Text className="text-[10px] text-gray-500 mt-0.5 capitalize">{s}</Text>
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
                  <Text className="text-indigo-600 text-xs font-medium">View all</Text>
                </TouchableOpacity>
              </View>
              {recentOrders.map((order: any) => (
                <TouchableOpacity
                  key={order.id}
                  onPress={() => router.push(`/orders/${order.id}`)}
                  className="flex-row items-center gap-3 px-4 py-3 border-b border-gray-50 active:bg-gray-50"
                >
                  <View className="flex-1 min-w-0">
                    <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                      {order.customer_name}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-0.5">
                      #{order.id} · {order.order_type}
                    </Text>
                  </View>
                  <View className="items-end gap-1">
                    <Text className="text-sm font-bold text-gray-900">
                      {currencySymbol}{Number(order.total).toFixed(0)}
                    </Text>
                    <View
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[order.status]?.bg }}
                    >
                      <Text className="text-[10px] font-medium capitalize" style={{ color: STATUS_COLORS[order.status]?.text }}>
                        {order.status}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-gray-400">›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Plan Info */}
          {merchant?.subscription_plan && (
            <View className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 flex-row items-center gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">
                  {merchant.subscription_plan} plan
                </Text>
                {merchant.plan_days_remaining && (
                  <Text className="text-xs text-indigo-400 mt-0.5">
                    {merchant.plan_days_remaining} days remaining
                  </Text>
                )}
              </View>
              <View className={`px-2 py-1 rounded-full ${merchant.plan_active ? 'bg-indigo-600' : 'bg-red-500'}`}>
                <Text className="text-white text-xs font-medium">
                  {merchant.plan_active ? 'Active' : 'Expired'}
                </Text>
              </View>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
