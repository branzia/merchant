import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { ui } from '@/config';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomTabBar from '@/components/BottomTabBar';
import { useResponsive } from '@/hooks/useIsTablet';

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending:   { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  delivered: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  rejected:  { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { merchant } = useAuth();
  const { container, isTablet } = useResponsive();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const currencySymbol = merchant?.currency_symbol ?? '';

  useEffect(() => {
    api.getOrder(Number(id)).then((res) => {
      if (res.status === 200) setOrder(res.data);
      setLoading(false);
    });
  }, [id]);

  const handleStatus = async (status: string, reason?: string) => {
    setUpdating(true);
    const res = await api.updateOrderStatus(Number(id), status, reason);
    setUpdating(false);
    if (res.status === 200) {
      setOrder(res.data);
      setRejectModal(false);
    } else {
      Alert.alert('Error', res.data?.message ?? 'Failed to update status.');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color={ui.accent} />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-500">Order not found</Text>
      </View>
    );
  }

  const sc = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="bg-white border-b border-gray-100 px-4 py-3 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="font-semibold text-base text-gray-900 flex-1">Order #{order.id}</Text>
        <View
          className="px-3 py-1 rounded-full border"
          style={{ backgroundColor: sc.bg, borderColor: sc.border }}
        >
          <Text className="text-xs font-semibold uppercase" style={{ color: sc.text }}>
            {order.status}
          </Text>
        </View>
        {/* Chat button with unread badge */}
        <TouchableOpacity
          onPress={() => router.push(`/orders/${id}/chat` as any)}
          className="relative w-10 h-10 items-center justify-center rounded-full bg-indigo-100"
        >
          <Text className="text-xl">💬</Text>
          {order.unread_messages > 0 && (
            <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
              <Text className="text-white text-[10px] font-bold">{order.unread_messages}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 py-4 gap-4" style={container}>

          {/* Customer */}
          <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <View className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</Text>
            </View>
            <View className="px-4 py-3 flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center">
                <Text className="text-indigo-600 font-bold text-base">
                  {order.customer_name[0].toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-sm text-gray-900">{order.customer_name}</Text>
                <Text className="text-indigo-600 text-xs mt-0.5">{order.customer_phone}</Text>
                {order.customer_address ? (
                  <Text className="text-xs text-gray-500 mt-0.5">📍 {order.customer_address}</Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Order Info */}
          <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <View className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Details</Text>
            </View>
            <View className="px-4 py-3 gap-2.5">
              {[
                ['Order Type', order.order_type],
                ['Payment', order.payment_method.toUpperCase()],
                ['Payment Status', order.payment_status],
              ].map(([label, val]) => (
                <View key={label} className="flex-row justify-between">
                  <Text className="text-sm text-gray-500">{label}</Text>
                  <Text className="text-sm font-medium text-gray-900 capitalize">{val}</Text>
                </View>
              ))}
              {order.notes ? (
                <View className="pt-2 border-t border-gray-50">
                  <Text className="text-xs text-gray-500">Note:</Text>
                  <Text className="text-sm text-gray-700 italic mt-0.5">"{order.notes}"</Text>
                </View>
              ) : null}
              {order.reject_reason ? (
                <View className="bg-red-50 -mx-4 px-4 py-2 mt-1">
                  <Text className="text-xs text-red-500 font-medium">Rejection reason:</Text>
                  <Text className="text-sm text-red-700 mt-0.5">{order.reject_reason}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Items */}
          <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <View className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</Text>
            </View>
            {(order.items ?? []).map((item: any) => (
              <View key={item.id} className="flex-row items-center justify-between px-4 py-3 border-b border-gray-50">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-900">{item.product_name}</Text>
                  <Text className="text-xs text-gray-500">{currencySymbol}{Number(item.price).toFixed(0)} × {item.quantity}</Text>
                </View>
                <Text className="text-sm font-semibold text-gray-900">{currencySymbol}{Number(item.subtotal).toFixed(0)}</Text>
              </View>
            ))}
            <View className="px-4 py-3 bg-gray-50 gap-1.5">
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Subtotal</Text>
                <Text className="text-sm text-gray-700">{currencySymbol}{Number(order.subtotal).toFixed(0)}</Text>
              </View>
              {Number(order.delivery_charge) > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-500">Delivery</Text>
                  <Text className="text-sm text-gray-700">{currencySymbol}{Number(order.delivery_charge).toFixed(0)}</Text>
                </View>
              )}
              <View className="flex-row justify-between pt-2 border-t border-gray-200">
                <Text className="text-base font-bold text-gray-900">Total</Text>
                <Text className="text-base font-bold text-gray-900">{currencySymbol}{Number(order.total).toFixed(0)}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          {order.status === 'pending' && (
            <View className="gap-2 pb-4">
              <TouchableOpacity
                onPress={() => handleStatus('confirmed')}
                disabled={updating}
                className="bg-blue-600 rounded-2xl py-4 items-center"
                style={{ opacity: updating ? 0.7 : 1 }}
              >
                <Text className="text-white font-semibold text-base">Confirm Order</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRejectModal(true)}
                disabled={updating}
                className="bg-red-50 border border-red-200 rounded-2xl py-4 items-center"
              >
                <Text className="text-red-600 font-semibold text-base">Reject Order</Text>
              </TouchableOpacity>
            </View>
          )}

          {order.status === 'confirmed' && (
            <TouchableOpacity
              onPress={() => handleStatus('delivered')}
              disabled={updating}
              className="bg-green-600 rounded-2xl py-4 items-center mb-4"
              style={{ opacity: updating ? 0.7 : 1 }}
            >
              <Text className="text-white font-semibold text-base">Mark as Delivered</Text>
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>

      <BottomTabBar activeTab="orders" />

      {/* Reject Modal */}
      <Modal visible={rejectModal} transparent animationType={isTablet ? 'fade' : 'slide'}>
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: isTablet ? 'center' : 'flex-end',
          alignItems: isTablet ? 'center' : undefined,
        }}>
          <View style={{
            backgroundColor: '#fff',
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 40,
            borderRadius: isTablet ? 24 : undefined,
            borderTopLeftRadius: isTablet ? undefined : 24,
            borderTopRightRadius: isTablet ? undefined : 24,
            width: isTablet ? 480 : undefined,
          }}>
            <Text className="text-xl font-bold text-gray-900 mb-4">Reject Order</Text>
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Reason for rejection</Text>
            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="e.g. Out of stock, closing early..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              className="border border-gray-300 rounded-2xl px-4 py-3 text-sm text-gray-900 mb-4"
              style={{ textAlignVertical: 'top', minHeight: 80 }}
            />
            <TouchableOpacity
              onPress={() => {
                if (!rejectReason.trim()) {
                  Alert.alert('Required', 'Please enter a rejection reason.');
                  return;
                }
                handleStatus('rejected', rejectReason.trim());
              }}
              disabled={updating}
              className="bg-red-600 rounded-2xl py-4 items-center mb-2"
              style={{ opacity: updating ? 0.7 : 1 }}
            >
              <Text className="text-white font-semibold">Confirm Rejection</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRejectModal(false)} className="py-3 items-center">
              <Text className="text-gray-500 font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
