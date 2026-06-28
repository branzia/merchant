import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Image, RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as api from '@/services/api';
import { useDrawer } from '@/context/DrawerContext';
import { useAuth } from '@/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProductsScreen() {
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const { merchant } = useAuth();
  const currencySymbol = merchant?.currency_symbol ?? '';
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [meta, setMeta] = useState<any>(null);
  const [page, setPage] = useState(1);

  const load = async (p = 1, reset = false) => {
    const params: Record<string, string> = { page: String(p) };
    if (search.trim()) params.search = search.trim();
    if (categoryId) params.category_id = categoryId;
    const [pRes, cRes] = await Promise.all([
      api.getProducts(params),
      categories.length === 0 ? api.getCategories() : Promise.resolve(null),
    ]);
    if (pRes.status === 200) {
      setProducts(reset ? pRes.data.data : [...(p > 1 ? products : []), ...pRes.data.data]);
      setMeta(pRes.data.meta);
    }
    if (cRes?.status === 200) setCategories(cRes.data.data);
    setLoading(false);
  };

  useEffect(() => { setPage(1); setLoading(true); load(1, true); }, [categoryId]);

  const onSearch = () => { setPage(1); setLoading(true); load(1, true); };

  const onRefresh = useCallback(async () => {
    setRefreshing(true); setPage(1);
    await load(1, true);
    setRefreshing(false);
  }, [search, categoryId]);

  const handleToggle = async (id: number) => {
    const res = await api.toggleProduct(id);
    if (res.status === 200) {
      setProducts((prev) => prev.map((p) => p.id === id ? res.data : p));
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Product', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const res = await api.deleteProduct(id);
          if (res.status === 200) {
            setProducts((prev) => prev.filter((p) => p.id !== id));
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-100 px-4 pt-4 pb-3 gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={openDrawer} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text className="text-2xl text-gray-400">☰</Text>
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">Products</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/products/create')}
            className="w-9 h-9 bg-indigo-600 rounded-full items-center justify-center"
          >
            <Text className="text-white text-2xl font-light leading-none" style={{ lineHeight: 26 }}>+</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center bg-gray-100 rounded-2xl px-3 gap-2">
          <Text className="text-gray-400">🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={onSearch}
            placeholder="Search products..."
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
            className="flex-1 py-2.5 text-sm text-gray-900"
          />
        </View>

        {categories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setCategoryId('')}
                className={`px-3 py-1.5 rounded-full ${!categoryId ? 'bg-indigo-600' : 'bg-gray-100'}`}
              >
                <Text className={`text-xs font-medium ${!categoryId ? 'text-white' : 'text-gray-600'}`}>All</Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategoryId(String(cat.id))}
                  className={`px-3 py-1.5 rounded-full ${categoryId === String(cat.id) ? 'bg-indigo-600' : 'bg-gray-100'}`}
                >
                  <Text className={`text-xs font-medium ${categoryId === String(cat.id) ? 'text-white' : 'text-gray-600'}`}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
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
            {products.length === 0 ? (
              <View className="items-center py-20">
                <Text className="text-5xl mb-3">📦</Text>
                <Text className="text-gray-500 font-medium">No products yet</Text>
                <TouchableOpacity onPress={() => router.push('/products/create')} className="mt-3">
                  <Text className="text-indigo-600 text-sm font-medium">+ Add your first product</Text>
                </TouchableOpacity>
              </View>
            ) : (
              products.map((product) => (
                <View key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <View className="flex-row gap-3 p-3">
                    {/* Image */}
                    <View className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                      {product.image ? (
                        <Image source={{ uri: product.image }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <View className="w-full h-full items-center justify-center">
                          <Text className="text-2xl">📷</Text>
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <View className="flex-1">
                      <View className="flex-row items-start justify-between gap-2">
                        <Text className="font-semibold text-sm text-gray-900 flex-1" numberOfLines={1}>
                          {product.name}
                        </Text>
                        <Text className="text-sm font-bold text-indigo-600 shrink-0">
                          {currencySymbol}{Number(product.price).toFixed(0)}
                        </Text>
                      </View>
                      {product.category && (
                        <View className="bg-gray-100 self-start px-2 py-0.5 rounded-full mt-1">
                          <Text className="text-[10px] text-gray-500">{product.category.name}</Text>
                        </View>
                      )}
                      <View className="flex-row items-center mt-2 gap-3">
                        {/* Toggle */}
                        <TouchableOpacity
                          onPress={() => handleToggle(product.id)}
                          className="flex-row items-center gap-2"
                        >
                          <View
                            className={`w-10 h-5 rounded-full justify-center ${product.is_available ? 'bg-green-500' : 'bg-gray-300'}`}
                          >
                            <View
                              className="w-4 h-4 rounded-full bg-white shadow-sm mx-0.5"
                              style={{ alignSelf: product.is_available ? 'flex-end' : 'flex-start' }}
                            />
                          </View>
                          <Text className="text-xs text-gray-500">
                            {product.is_available ? 'Available' : 'Unavailable'}
                          </Text>
                        </TouchableOpacity>

                        <View className="flex-row gap-2 ml-auto">
                          <TouchableOpacity
                            onPress={() => router.push(`/products/${product.id}/edit`)}
                            className="p-1.5 rounded-xl bg-indigo-50"
                          >
                            <Text>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDelete(product.id)}
                            className="p-1.5 rounded-xl bg-red-50"
                          >
                            <Text>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
