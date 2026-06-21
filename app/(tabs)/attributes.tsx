import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, Alert, RefreshControl, ActivityIndicator, Switch,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import * as api from '@/services/api';
import { useDrawer } from '@/context/DrawerContext';
import { SafeAreaView } from 'react-native-safe-area-context';

type AttrType = 'select' | 'text';

interface Attribute {
  id: number;
  name: string;
  type: AttrType;
  values: string[];
  sort_order: number;
  is_active: boolean;
  is_system: boolean;
}

const BLANK_FORM = { name: '', type: 'select' as AttrType, values: [] as string[], is_active: true };

export default function AttributesScreen() {
  const { openDrawer } = useDrawer();
  const [attrs, setAttrs] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Attribute | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await api.getAttributes();
    if (res.status === 200) setAttrs(res.data.data);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(BLANK_FORM);
    setNewValue('');
    setModalVisible(true);
  };

  const openEdit = (attr: Attribute) => {
    setEditTarget(attr);
    setForm({ name: attr.name, type: attr.type, values: [...attr.values], is_active: attr.is_active });
    setNewValue('');
    setModalVisible(true);
  };

  const addValue = () => {
    const v = newValue.trim();
    if (!v) return;
    setForm(f => ({ ...f, values: [...f.values, v] }));
    setNewValue('');
  };

  const removeValue = (idx: number) => {
    setForm(f => ({ ...f, values: f.values.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Required', 'Attribute name is required.');
      return;
    }
    if (form.type === 'select' && form.values.length === 0) {
      Alert.alert('Required', 'Add at least one option for a Select attribute.');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      type: form.type,
      values: form.type === 'select' ? form.values : [],
      is_active: form.is_active,
    };
    const res = editTarget
      ? await api.updateAttribute(editTarget.id, payload)
      : await api.createAttribute(payload);
    setSaving(false);
    if (res.status === 200 || res.status === 201) {
      setAttrs(prev =>
        editTarget
          ? prev.map(a => a.id === editTarget.id ? res.data : a)
          : [...prev, res.data]
      );
      setModalVisible(false);
    } else {
      Alert.alert('Error', res.data?.message ?? 'Failed to save attribute.');
    }
  };

  const handleDelete = (attr: Attribute) => {
    Alert.alert(
      'Delete Attribute',
      `Delete "${attr.name}"? Existing products won't be affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            const res = await api.deleteAttribute(attr.id);
            if (res.status === 200) {
              setAttrs(prev => prev.filter(a => a.id !== attr.id));
            } else {
              Alert.alert('Error', 'Failed to delete attribute.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-100 px-4 pt-4 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={openDrawer} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text className="text-2xl text-gray-400">☰</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-gray-900">Attributes</Text>
            <Text className="text-xs text-gray-400 mt-0.5">Custom fields buyers fill when ordering</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={openCreate}
          className="w-9 h-9 bg-indigo-600 rounded-full items-center justify-center"
        >
          <Text className="text-white text-2xl font-light" style={{ lineHeight: 26 }}>+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View className="px-4 py-3 gap-3">
            {attrs.length === 0 ? (
              <View className="items-center py-20">
                <Text className="text-5xl mb-3">🎛️</Text>
                <Text className="text-gray-500 font-medium">No attributes yet</Text>
                <Text className="text-gray-400 text-xs mt-1 text-center px-8">
                  Attributes let buyers choose options like Size, Flavour, or add custom text
                </Text>
                <TouchableOpacity onPress={openCreate} className="mt-4">
                  <Text className="text-indigo-600 text-sm font-medium">+ Create first attribute</Text>
                </TouchableOpacity>
              </View>
            ) : (
              attrs.map((attr) => (
                <View key={attr.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
                  <View className="flex-row items-start gap-3">
                    <View className="flex-1 gap-1.5">
                      <View className="flex-row items-center gap-2 flex-wrap">
                        <Text className="font-semibold text-gray-900">{attr.name}</Text>
                        <View className={`px-2 py-0.5 rounded-full ${attr.type === 'select' ? 'bg-indigo-50' : 'bg-gray-100'}`}>
                          <Text className={`text-[10px] font-bold uppercase ${attr.type === 'select' ? 'text-indigo-600' : 'text-gray-500'}`}>
                            {attr.type}
                          </Text>
                        </View>
                        {attr.is_system && (
                          <View className="bg-amber-50 px-2 py-0.5 rounded-full">
                            <Text className="text-[10px] font-bold text-amber-600 uppercase">system</Text>
                          </View>
                        )}
                        {!attr.is_active && (
                          <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                            <Text className="text-[10px] font-bold text-gray-400 uppercase">inactive</Text>
                          </View>
                        )}
                      </View>
                      {attr.type === 'select' && attr.values.length > 0 ? (
                        <Text className="text-xs text-gray-500">{attr.values.join(' · ')}</Text>
                      ) : attr.type === 'text' ? (
                        <Text className="text-xs text-gray-400">Buyer types a custom value</Text>
                      ) : null}
                    </View>
                    {!attr.is_system && (
                      <View className="flex-row gap-2">
                        <TouchableOpacity onPress={() => openEdit(attr)} className="p-2 rounded-xl bg-indigo-50">
                          <Text>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(attr)} className="p-2 rounded-xl bg-red-50">
                          <Text>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Create / Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <View className="bg-white rounded-t-3xl" style={{ maxHeight: '88%' }}>
            <ScrollView
              className="px-6 pt-6"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-xl font-bold text-gray-900 mb-4">
                {editTarget ? 'Edit Attribute' : 'New Attribute'}
              </Text>

              {/* Name */}
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Name</Text>
              <TextInput
                value={form.name}
                onChangeText={t => setForm(f => ({ ...f, name: t }))}
                placeholder="e.g. Size, Flavour, Inscription..."
                placeholderTextColor="#9CA3AF"
                autoFocus
                className="border border-gray-300 rounded-2xl px-4 py-3.5 text-sm text-gray-900 mb-4"
              />

              {/* Type */}
              <Text className="text-sm font-medium text-gray-700 mb-2">Type</Text>
              <View className="flex-row gap-2 mb-4">
                {(['select', 'text'] as AttrType[]).map(t => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setForm(f => ({ ...f, type: t, values: t === 'text' ? [] : f.values }))}
                    className={`flex-1 py-3 rounded-xl items-center border ${form.type === t ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`text-xs font-semibold ${form.type === t ? 'text-white' : 'text-gray-600'}`}>
                      {t === 'select' ? '☑ Select (options)' : '✍ Text (free input)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Values — select only */}
              {form.type === 'select' && (
                <View className="mb-4 gap-2">
                  <Text className="text-sm font-medium text-gray-700">Options</Text>
                  {form.values.map((v, i) => (
                    <View key={i} className="flex-row items-center gap-2">
                      <View className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                        <Text className="text-sm text-gray-900">{v}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeValue(i)}
                        className="w-9 h-9 rounded-xl bg-red-50 items-center justify-center"
                      >
                        <Text className="text-red-500 font-bold text-base">×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <View className="flex-row gap-2">
                    <TextInput
                      value={newValue}
                      onChangeText={setNewValue}
                      onSubmitEditing={addValue}
                      placeholder="Add an option..."
                      placeholderTextColor="#9CA3AF"
                      returnKeyType="done"
                      className="flex-1 border border-dashed border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900"
                    />
                    <TouchableOpacity
                      onPress={addValue}
                      className="w-10 h-10 bg-indigo-600 rounded-xl items-center justify-center"
                    >
                      <Text className="text-white text-xl font-bold">+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Active toggle */}
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-sm font-medium text-gray-700">Active</Text>
                <Switch
                  value={form.is_active}
                  onValueChange={v => setForm(f => ({ ...f, is_active: v }))}
                  trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className="bg-indigo-600 rounded-2xl py-4 items-center mb-2"
                style={{ opacity: saving ? 0.6 : 1 }}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold">
                    {editTarget ? 'Save Changes' : 'Create Attribute'}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="py-3 items-center mb-6">
                <Text className="text-gray-500 font-medium">Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
