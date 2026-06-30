import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { ui } from '@/config';
import { useCallback, useEffect, useState } from 'react';
import * as api from '@/services/api';
import { useDrawer } from '@/context/DrawerContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CategoriesScreen() {
  const { openDrawer } = useDrawer();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create modal
  const [createModal, setCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editModal, setEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await api.getCategories();
    if (res.status === 200) setCategories(res.data.data);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await api.createCategory({ name: newName.trim(), is_active: true });
    setCreating(false);
    if (res.status === 201) {
      setCategories((prev) => [...prev, res.data]);
      setNewName('');
      setCreateModal(false);
    } else {
      Alert.alert('Error', res.data?.message ?? 'Failed to create category.');
    }
  };

  const openEdit = (cat: any) => {
    setEditTarget(cat);
    setEditName(cat.name);
    setEditModal(true);
  };

  const handleEdit = async () => {
    if (!editName.trim() || !editTarget) return;
    setSaving(true);
    const res = await api.updateCategory(editTarget.id, { name: editName.trim(), is_active: editTarget.is_active });
    setSaving(false);
    if (res.status === 200) {
      setCategories((prev) => prev.map((c) => c.id === editTarget.id ? res.data : c));
      setEditModal(false);
    } else {
      Alert.alert('Error', res.data?.message ?? 'Failed to update category.');
    }
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete Category', `Delete "${name}"? Products in this category won't be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const res = await api.deleteCategory(id);
          if (res.status === 200) {
            setCategories((prev) => prev.filter((c) => c.id !== id));
          } else {
            Alert.alert('Error', 'Failed to delete category.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-100 px-4 pt-4 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={openDrawer} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text className="text-2xl text-gray-400">☰</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Categories</Text>
        </View>
        <TouchableOpacity
          onPress={() => setCreateModal(true)}
          className="w-9 h-9 bg-indigo-600 rounded-full items-center justify-center"
        >
          <Text className="text-white text-2xl font-light" style={{ lineHeight: 26 }}>+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={ui.accent} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View className="px-4 py-3 gap-3">
            {categories.length === 0 ? (
              <View className="items-center py-20">
                <Text className="text-5xl mb-3">🏷️</Text>
                <Text className="text-gray-500 font-medium">No categories yet</Text>
                <TouchableOpacity onPress={() => setCreateModal(true)} className="mt-3">
                  <Text className="text-indigo-600 text-sm font-medium">+ Create first category</Text>
                </TouchableOpacity>
              </View>
            ) : (
              categories.map((cat) => (
                <View
                  key={cat.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex-row items-center gap-3"
                >
                  <View className="w-10 h-10 rounded-xl bg-indigo-50 items-center justify-center">
                    <Text className="text-indigo-600 font-bold text-base">
                      {cat.name[0].toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">{cat.name}</Text>
                    <Text className="text-xs text-gray-500 mt-0.5">
                      {cat.products_count ?? 0} products
                    </Text>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => openEdit(cat)}
                      className="p-2 rounded-xl bg-indigo-50"
                    >
                      <Text>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(cat.id, cat.name)}
                      className="p-2 rounded-xl bg-red-50"
                    >
                      <Text>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Create Modal */}
      <Modal visible={createModal} transparent animationType="slide">
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
            <Text className="text-xl font-bold text-gray-900 mb-4">New Category</Text>
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Category Name</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Cakes, Drinks..."
              placeholderTextColor="#9CA3AF"
              autoFocus
              className="border border-gray-300 rounded-2xl px-4 py-3.5 text-sm text-gray-900 mb-4"
            />
            <TouchableOpacity
              onPress={handleCreate}
              disabled={creating || !newName.trim()}
              className="bg-indigo-600 rounded-2xl py-4 items-center mb-2"
              style={{ opacity: creating || !newName.trim() ? 0.6 : 1 }}
            >
              <Text className="text-white font-semibold">Create Category</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setCreateModal(false); setNewName(''); }} className="py-3 items-center">
              <Text className="text-gray-500 font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={editModal} transparent animationType="slide">
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
            <Text className="text-xl font-bold text-gray-900 mb-4">Edit Category</Text>
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Category Name</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              autoFocus
              className="border border-gray-300 rounded-2xl px-4 py-3.5 text-sm text-gray-900 mb-4"
            />
            <TouchableOpacity
              onPress={handleEdit}
              disabled={saving || !editName.trim()}
              className="bg-indigo-600 rounded-2xl py-4 items-center mb-2"
              style={{ opacity: saving || !editName.trim() ? 0.6 : 1 }}
            >
              <Text className="text-white font-semibold">Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditModal(false)} className="py-3 items-center">
              <Text className="text-gray-500 font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
