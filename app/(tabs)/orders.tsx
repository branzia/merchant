import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { ui } from '@/config';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useDrawer } from '@/context/DrawerContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const STATUSES = ['', 'pending', 'confirmed', 'delivered', 'rejected'] as const;
const STATUS_LABELS: Record<string, string> = {
  '': 'All', pending: 'Pending', confirmed: 'Confirmed',
  delivered: 'Delivered', rejected: 'Rejected',
};
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:   { bg: '#FEF3C7', text: '#92400E' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF' },
  delivered: { bg: '#D1FAE5', text: '#065F46' },
  rejected:  { bg: '#FEE2E2', text: '#991B1B' },
};

export default function OrdersScreen() {
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const { merchant } = useAuth();
  const currencySymbol = merchant?.currency_symbol ?? '';
  const params = useLocalSearchParams<{ status?: string }>();
  const [orders, setOrders] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [status, setStatus] = useState(params.status ?? '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (p = 1, reset = false) => {
    const filters: Record<string, string> = { page: String(p) };
    if (status) filters.status = status;
    if (search.trim()) filters.search = search.trim();
    const res = await api.getOrders(filters);
    if (res.status === 200) {
      setOrders(reset ? res.data.data : [...(p > 1 ? orders : []), ...res.data.data]);
      setMeta(res.data.meta);
    }
    setLoading(false);
  };

  useEffect(() => { setPage(1); setLoading(true); load(1, true); }, [status]);

  const onSearch = () => { setPage(1); setLoading(true); load(1, true); };

  const onRefresh = useCallback(async () => {
    setRefreshing(true); setPage(1);
    await load(1, true);
    setRefreshing(false);
  }, [status, search]);

  const loadMore = () => {
    if (meta && page < meta.last_page) {
      const next = page + 1;
      setPage(next);
      load(next);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-100 px-4 pt-4 pb-3 gap-3">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={openDrawer} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text className="text-2xl text-gray-400">☰</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Orders</Text>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-2xl px-3 gap-2">
          <Text className="text-gray-400">🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={onSearch}
            placeholder="Search name, phone, order ID..."
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
            className="flex-1 py-2.5 text-sm text-gray-900"
          />
        </View>

        {/* Status Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {STATUSES.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-full ${status === s ? 'bg-indigo-600' : 'bg-gray-100'}`}
              >
                <Text className={`text-xs font-medium ${status === s ? 'text-white' : 'text-gray-600'}`}>
                  {STATUS_LABELS[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={ui.accent} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onMomentumScrollEnd={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 20) {
              loadMore();
            }
          }}
        >
          <View className="px-4 py-3 gap-3">
            {orders.length === 0 ? (
              <View className="items-center py-20">
                <Text className="text-5xl mb-3">📋</Text>
                <Text className="text-gray-500 font-medium">No orders found</Text>
                <Text className="text-gray-400 text-sm mt-1">Try adjusting your filters</Text>
              </View>
            ) : (
              orders.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  onPress={() => router.push(`/orders/${order.id}`)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 active:bg-gray-50"
                >
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1">
                      <Text className="font-semibold text-sm text-gray-900">{order.customer_name}</Text>
                      <Text className="text-xs text-gray-500 mt-0.5">{order.customer_phone}</Text>
                    </View>
                    <View
                      className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[order.status]?.bg }}
                    >
                      <Text className="text-[11px] font-medium capitalize" style={{ color: STATUS_COLORS[order.status]?.text }}>
                        {order.status}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between mt-3">
                    <View className="flex-row gap-3 items-center">
                      <Text className="text-xs text-gray-500">#{order.id}</Text>
                      <Text className="text-xs text-gray-500 capitalize">{order.order_type}</Text>
                      <Text className="text-xs text-gray-500 uppercase">{order.payment_method}</Text>
                      {order.unread_messages > 0 && (
                        <View className="flex-row items-center gap-1 bg-red-50 px-1.5 py-0.5 rounded-full">
                          <Text className="text-[10px]">💬</Text>
                          <Text className="text-[10px] font-bold text-red-600">{order.unread_messages}</Text>
                        </View>
                      )}
                    </View>
                    <Text className="font-bold text-gray-900">{currencySymbol}{Number(order.total).toFixed(0)}</Text>
                  </View>
                  <Text className="text-xs text-gray-400 mt-2">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
