import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Switch, Alert, ActivityIndicator, Modal, RefreshControl,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as api from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

type DeliveryType = 'flat' | 'zone' | 'free';

interface Zone {
  id: number;
  zone_name: string;
  delivery_charge: number;
  is_active: boolean;
}

interface DeliverySettings {
  offers_delivery: boolean;
  offers_pickup: boolean;
  pickup_address: string | null;
  estimated_time: number | null;
  min_order_amount: number | null;
  delivery_type: DeliveryType;
  flat_delivery_charge: number | null;
  free_delivery_enabled: boolean;
  free_delivery_above: number | null;
  zones: Zone[];
}

function Field({
  label, value, onChangeText, placeholder, keyboardType, required,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; keyboardType?: any; required?: boolean;
}) {
  return (
    <View>
      <Text className="text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <Text className="text-red-500"> *</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType ?? 'default'}
        className="border border-gray-300 rounded-2xl px-4 py-3.5 text-sm text-gray-900 bg-white"
      />
    </View>
  );
}

export default function DeliveryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Settings state
  const [offersDelivery, setOffersDelivery] = useState(false);
  const [offersPickup, setOffersPickup] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('flat');
  const [flatCharge, setFlatCharge] = useState('');
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState(false);
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState('');

  // Zones state
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneModal, setZoneModal] = useState(false);
  const [editZone, setEditZone] = useState<Zone | null>(null);
  const [zoneName, setZoneName] = useState('');
  const [zoneCharge, setZoneCharge] = useState('');
  const [zoneActive, setZoneActive] = useState(true);
  const [savingZone, setSavingZone] = useState(false);

  const populate = (d: DeliverySettings) => {
    setOffersDelivery(d.offers_delivery);
    setOffersPickup(d.offers_pickup);
    setPickupAddress(d.pickup_address ?? '');
    setEstimatedTime(d.estimated_time ? String(d.estimated_time) : '');
    setMinOrder(d.min_order_amount ? String(d.min_order_amount) : '');
    setDeliveryType(d.delivery_type ?? 'flat');
    setFlatCharge(d.flat_delivery_charge ? String(d.flat_delivery_charge) : '');
    setFreeDeliveryEnabled(d.free_delivery_enabled ?? false);
    setFreeDeliveryAbove(d.free_delivery_above ? String(d.free_delivery_above) : '');
    setZones(d.zones ?? []);
  };

  const load = async () => {
    const res = await api.getDelivery();
    if (res.status === 200) populate(res.data.data);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload: Record<string, unknown> = {
      offers_delivery: offersDelivery,
      offers_pickup: offersPickup,
      delivery_type: deliveryType,
      free_delivery_enabled: freeDeliveryEnabled,
    };
    if (pickupAddress.trim()) payload.pickup_address = pickupAddress.trim();
    if (estimatedTime) payload.estimated_time = Number(estimatedTime);
    if (minOrder) payload.min_order_amount = Number(minOrder);
    if (deliveryType === 'flat' && flatCharge) payload.flat_delivery_charge = Number(flatCharge);
    if (freeDeliveryEnabled && freeDeliveryAbove) payload.free_delivery_above = Number(freeDeliveryAbove);

    const res = await api.updateDelivery(payload);
    setSaving(false);
    if (res.status === 200) {
      Alert.alert('Saved', 'Delivery settings updated.');
    } else {
      Alert.alert('Error', res.data?.message ?? 'Failed to save settings.');
    }
  };

  const openCreateZone = () => {
    setEditZone(null);
    setZoneName('');
    setZoneCharge('');
    setZoneActive(true);
    setZoneModal(true);
  };

  const openEditZone = (z: Zone) => {
    setEditZone(z);
    setZoneName(z.zone_name);
    setZoneCharge(String(z.delivery_charge));
    setZoneActive(z.is_active);
    setZoneModal(true);
  };

  const handleSaveZone = async () => {
    if (!zoneName.trim()) {
      Alert.alert('Required', 'Zone name is required.');
      return;
    }
    if (!zoneCharge || isNaN(Number(zoneCharge))) {
      Alert.alert('Required', 'Valid delivery charge is required.');
      return;
    }
    setSavingZone(true);
    const payload = {
      zone_name: zoneName.trim(),
      delivery_charge: Number(zoneCharge),
      is_active: zoneActive,
    };
    const res = editZone
      ? await api.updateZone(editZone.id, payload)
      : await api.createZone(payload);
    setSavingZone(false);
    if (res.status === 200 || res.status === 201) {
      setZones((prev) =>
        editZone
          ? prev.map((z) => z.id === editZone.id ? res.data : z)
          : [...prev, res.data]
      );
      setZoneModal(false);
    } else {
      Alert.alert('Error', res.data?.message ?? 'Failed to save zone.');
    }
  };

  const handleDeleteZone = (z: Zone) => {
    Alert.alert('Delete Zone', `Delete zone "${z.zone_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const res = await api.deleteZone(z.id);
          if (res.status === 200) {
            setZones((prev) => prev.filter((zone) => zone.id !== z.id));
          } else {
            Alert.alert('Error', 'Failed to delete zone.');
          }
        },
      },
    ]);
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
      <View className="bg-white border-b border-gray-100 px-4 py-3 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="font-semibold text-base text-gray-900">Delivery Settings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-4 py-4 gap-5">

          {/* Delivery & Pickup toggles */}
          <View className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4">
            <View className="flex-row items-center justify-between py-3.5 border-b border-gray-50">
              <View>
                <Text className="text-sm font-medium text-gray-900">Offers Delivery</Text>
                <Text className="text-xs text-gray-500 mt-0.5">Deliver orders to customers</Text>
              </View>
              <Switch
                value={offersDelivery}
                onValueChange={setOffersDelivery}
                trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View className="flex-row items-center justify-between py-3.5">
              <View>
                <Text className="text-sm font-medium text-gray-900">Offers Pickup</Text>
                <Text className="text-xs text-gray-500 mt-0.5">Customers pick up from store</Text>
              </View>
              <Switch
                value={offersPickup}
                onValueChange={setOffersPickup}
                trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Pickup Address */}
          {offersPickup && (
            <Field
              label="Pickup Address"
              value={pickupAddress}
              onChangeText={setPickupAddress}
              placeholder="Shop No 5, MG Road"
            />
          )}

          {/* Order settings */}
          <View className="gap-4">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Settings</Text>
            <Field
              label="Estimated Time (minutes)"
              value={estimatedTime}
              onChangeText={setEstimatedTime}
              placeholder="60"
              keyboardType="number-pad"
            />
            <Field
              label="Minimum Order Amount"
              value={minOrder}
              onChangeText={setMinOrder}
              placeholder="200"
              keyboardType="decimal-pad"
            />
          </View>

          {/* Delivery Type */}
          {offersDelivery && (
            <View className="gap-3">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Delivery Pricing</Text>
              <View className="flex-row gap-2">
                {([
                  { key: 'flat', label: '📦 Flat Rate' },
                  { key: 'zone', label: '📍 By Zone' },
                  { key: 'free', label: '🎁 Free' },
                ] as { key: DeliveryType; label: string }[]).map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setDeliveryType(key)}
                    className={`flex-1 py-3 rounded-2xl items-center border ${deliveryType === key ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`text-xs font-semibold ${deliveryType === key ? 'text-white' : 'text-gray-600'}`}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {deliveryType === 'flat' && (
                <Field
                  label="Flat Delivery Charge"
                  value={flatCharge}
                  onChangeText={setFlatCharge}
                  placeholder="50"
                  keyboardType="decimal-pad"
                />
              )}

              {/* Free delivery threshold */}
              {(deliveryType === 'flat' || deliveryType === 'zone') && (
                <View className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4">
                  <View className="flex-row items-center justify-between py-3.5">
                    <View>
                      <Text className="text-sm font-medium text-gray-900">Free Delivery Above Amount</Text>
                      <Text className="text-xs text-gray-500 mt-0.5">Waive charge if order total exceeds threshold</Text>
                    </View>
                    <Switch
                      value={freeDeliveryEnabled}
                      onValueChange={setFreeDeliveryEnabled}
                      trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                  {freeDeliveryEnabled && (
                    <View className="pb-3.5">
                      <Field
                        label="Free delivery above (amount)"
                        value={freeDeliveryAbove}
                        onChangeText={setFreeDeliveryAbove}
                        placeholder="500"
                        keyboardType="decimal-pad"
                      />
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Save Settings Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-indigo-600 rounded-2xl py-4 items-center"
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Save Delivery Settings</Text>
            )}
          </TouchableOpacity>

          {/* Delivery Zones (only when delivery_type === 'zone') */}
          {offersDelivery && deliveryType === 'zone' && (
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-sm font-semibold text-gray-900">Delivery Zones</Text>
                  <Text className="text-xs text-gray-500 mt-0.5">Set per-zone delivery charges</Text>
                </View>
                <TouchableOpacity
                  onPress={openCreateZone}
                  className="w-9 h-9 bg-indigo-600 rounded-full items-center justify-center"
                >
                  <Text className="text-white text-2xl font-light" style={{ lineHeight: 26 }}>+</Text>
                </TouchableOpacity>
              </View>

              {zones.length === 0 ? (
                <TouchableOpacity
                  onPress={openCreateZone}
                  className="border-2 border-dashed border-gray-200 rounded-2xl py-8 items-center"
                >
                  <Text className="text-3xl mb-2">📍</Text>
                  <Text className="text-gray-500 text-sm font-medium">No zones yet</Text>
                  <Text className="text-gray-400 text-xs mt-1">Tap to add your first zone</Text>
                </TouchableOpacity>
              ) : (
                zones.map((zone) => (
                  <View
                    key={zone.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex-row items-center gap-3"
                  >
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="font-semibold text-sm text-gray-900">{zone.zone_name}</Text>
                        {!zone.is_active && (
                          <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                            <Text className="text-[10px] text-gray-400 font-semibold">inactive</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-xs text-indigo-600 mt-0.5 font-medium">
                        Charge: {zone.delivery_charge}
                      </Text>
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => openEditZone(zone)}
                        className="p-2 rounded-xl bg-indigo-50"
                      >
                        <Text>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteZone(zone)}
                        className="p-2 rounded-xl bg-red-50"
                      >
                        <Text>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          <View className="h-4" />
        </View>
      </ScrollView>

      {/* Zone Modal */}
      <Modal visible={zoneModal} transparent animationType="slide">
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10 gap-4">
            <Text className="text-xl font-bold text-gray-900">
              {editZone ? 'Edit Zone' : 'New Delivery Zone'}
            </Text>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Zone Name <Text className="text-red-500">*</Text></Text>
              <TextInput
                value={zoneName}
                onChangeText={setZoneName}
                placeholder="e.g. City Centre, Suburbs"
                placeholderTextColor="#9CA3AF"
                autoFocus
                className="border border-gray-300 rounded-2xl px-4 py-3.5 text-sm text-gray-900"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Delivery Charge <Text className="text-red-500">*</Text></Text>
              <TextInput
                value={zoneCharge}
                onChangeText={setZoneCharge}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                className="border border-gray-300 rounded-2xl px-4 py-3.5 text-sm text-gray-900"
              />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-gray-700">Active</Text>
              <Switch
                value={zoneActive}
                onValueChange={setZoneActive}
                trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TouchableOpacity
              onPress={handleSaveZone}
              disabled={savingZone}
              className="bg-indigo-600 rounded-2xl py-4 items-center"
              style={{ opacity: savingZone ? 0.7 : 1 }}
            >
              {savingZone ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold">
                  {editZone ? 'Save Changes' : 'Create Zone'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setZoneModal(false)} className="py-2 items-center">
              <Text className="text-gray-500 font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
