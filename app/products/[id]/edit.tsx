import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  Switch, Alert, ActivityIndicator, Image, Modal,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as api from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Shared attribute types ────────────────────────────────────────────────

interface GlobalAttr {
  id: number;
  name: string;
  type: 'select' | 'text';
  values: string[];
  is_system: boolean;
  is_active: boolean;
}

interface ProductAttr {
  _key: number;
  source: 'predefined' | 'custom';
  predefined_id: number | null;
  label: string;
  type: 'select' | 'text';
  required: boolean;
  values: { label: string; price: number }[];
}

// ─── ProductAttrCard — module-level ───────────────────────────────────────

interface AttrCardProps {
  attr: ProductAttr;
  onChange: (updated: ProductAttr) => void;
  onRemove: () => void;
}

function ProductAttrCard({ attr, onChange, onRemove }: AttrCardProps) {
  const [newOptLabel, setNewOptLabel] = useState('');
  const [newOptPrice, setNewOptPrice] = useState('0');

  const addOpt = () => {
    if (!newOptLabel.trim()) return;
    onChange({
      ...attr,
      values: [...attr.values, { label: newOptLabel.trim(), price: Number(newOptPrice) || 0 }],
    });
    setNewOptLabel('');
    setNewOptPrice('0');
  };

  return (
    <View className="bg-white rounded-2xl border border-gray-200 p-3 gap-3">
      {/* Label · type · required · remove */}
      <View className="flex-row items-center gap-2">
        <TextInput
          value={attr.label}
          onChangeText={t => onChange({ ...attr, label: t })}
          placeholder="Attribute label"
          placeholderTextColor="#9CA3AF"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900"
        />
        <View className={`px-2 py-1 rounded-lg ${attr.type === 'select' ? 'bg-indigo-50' : 'bg-gray-100'}`}>
          <Text className={`text-[10px] font-bold uppercase ${attr.type === 'select' ? 'text-indigo-600' : 'text-gray-500'}`}>
            {attr.type}
          </Text>
        </View>
        <View className="items-center">
          <Text className="text-[9px] text-gray-400 mb-0.5">REQ</Text>
          <Switch
            value={attr.required}
            onValueChange={v => onChange({ ...attr, required: v })}
            trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
            thumbColor="#FFFFFF"
            style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
          />
        </View>
        <TouchableOpacity
          onPress={onRemove}
          className="w-8 h-8 rounded-xl bg-red-50 items-center justify-center"
        >
          <Text className="text-red-500 font-bold">×</Text>
        </TouchableOpacity>
      </View>

      {/* Values (select only) */}
      {attr.type === 'select' && (
        <View className="gap-1.5 pl-1">
          {attr.values.map((val, idx) => (
            <View key={idx} className="flex-row items-center gap-1.5">
              <TextInput
                value={val.label}
                onChangeText={t =>
                  onChange({ ...attr, values: attr.values.map((v, i) => i === idx ? { ...v, label: t } : v) })
                }
                placeholder="Option name"
                placeholderTextColor="#9CA3AF"
                className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 text-xs text-gray-900"
              />
              <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5">
                <Text className="text-xs text-gray-400 mr-1">+</Text>
                <TextInput
                  value={String(val.price)}
                  onChangeText={t =>
                    onChange({ ...attr, values: attr.values.map((v, i) => i === idx ? { ...v, price: Number(t) || 0 } : v) })
                  }
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  className="text-xs text-gray-900 w-10 text-right"
                />
              </View>
              <TouchableOpacity
                onPress={() => onChange({ ...attr, values: attr.values.filter((_, i) => i !== idx) })}
                className="w-7 h-7 rounded-lg bg-red-50 items-center justify-center"
              >
                <Text className="text-red-400 text-xs font-bold">×</Text>
              </TouchableOpacity>
            </View>
          ))}
          {/* Add option row */}
          <View className="flex-row items-center gap-1.5">
            <TextInput
              value={newOptLabel}
              onChangeText={setNewOptLabel}
              onSubmitEditing={addOpt}
              placeholder="Add option..."
              placeholderTextColor="#9CA3AF"
              returnKeyType="done"
              className="flex-1 border border-dashed border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900"
            />
            <View className="flex-row items-center border border-dashed border-gray-200 rounded-lg px-2 py-1.5">
              <Text className="text-xs text-gray-400 mr-1">+</Text>
              <TextInput
                value={newOptPrice}
                onChangeText={setNewOptPrice}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                className="text-xs text-gray-900 w-10 text-right"
              />
            </View>
            <TouchableOpacity
              onPress={addOpt}
              className="w-7 h-7 rounded-lg bg-indigo-600 items-center justify-center"
            >
              <Text className="text-white text-sm font-bold">+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {attr.type === 'text' && (
        <Text className="text-xs text-gray-400 pl-1">Buyer will enter a custom text value</Text>
      )}
    </View>
  );
}

// ─── AttrPickerModal — module-level ───────────────────────────────────────

interface PickerProps {
  visible: boolean;
  onClose: () => void;
  allAttrs: GlobalAttr[];
  addedLabels: Set<string>;
  onAdd: (attr: GlobalAttr) => void;
}

function AttrPickerModal({ visible, onClose, allAttrs, addedLabels, onAdd }: PickerProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View className="bg-white rounded-t-3xl" style={{ maxHeight: '70%' }}>
          <View className="px-6 pt-5 pb-3 flex-row items-center justify-between border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-900">Add Attribute</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-indigo-600 font-semibold">Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} className="px-4 py-3">
            <View className="gap-2">
              {allAttrs.length === 0 ? (
                <View className="items-center py-10">
                  <Text className="text-gray-400 text-sm">No attributes available</Text>
                  <Text className="text-gray-400 text-xs mt-1">Create attributes in the Attributes tab first</Text>
                </View>
              ) : (
                allAttrs.filter(a => a.is_active).map(attr => {
                  const isAdded = addedLabels.has(attr.name.toLowerCase());
                  return (
                    <TouchableOpacity
                      key={attr.id}
                      onPress={() => { if (!isAdded) { onAdd(attr); onClose(); } }}
                      className={`flex-row items-center gap-3 px-4 py-3 rounded-2xl border ${isAdded ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-white active:bg-gray-50'}`}
                    >
                      <View className="flex-1">
                        <Text className={`font-medium text-sm ${isAdded ? 'text-green-700' : 'text-gray-900'}`}>
                          {attr.name}
                        </Text>
                        <View className="flex-row gap-1.5 mt-0.5">
                          <View className={`px-1.5 py-0.5 rounded ${attr.type === 'select' ? 'bg-indigo-50' : 'bg-gray-100'}`}>
                            <Text className={`text-[10px] font-bold uppercase ${attr.type === 'select' ? 'text-indigo-600' : 'text-gray-400'}`}>
                              {attr.type}
                            </Text>
                          </View>
                          {attr.is_system && (
                            <View className="bg-amber-50 px-1.5 py-0.5 rounded">
                              <Text className="text-[10px] font-bold uppercase text-amber-500">system</Text>
                            </View>
                          )}
                          {attr.type === 'select' && attr.values.length > 0 && (
                            <Text className="text-[10px] text-gray-400">{attr.values.slice(0, 3).join(', ')}{attr.values.length > 3 ? '...' : ''}</Text>
                          )}
                        </View>
                      </View>
                      <Text className={`text-lg font-bold ${isAdded ? 'text-green-500' : 'text-indigo-500'}`}>
                        {isAdded ? '✓' : '+'}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────

export default function EditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [existingImage, setExistingImage] = useState('');
  const [newImage, setNewImage] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [allAttrs, setAllAttrs] = useState<GlobalAttr[]>([]);
  const [productAttrs, setProductAttrs] = useState<ProductAttr[]>([]);
  const [keyCounter, setKeyCounter] = useState(0);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      api.getProduct(Number(id)),
      api.getCategories(),
      api.getAttributes(),
    ]).then(([pRes, cRes, aRes]) => {
      if (pRes.status === 200) {
        const p = pRes.data;
        setName(p.name);
        setPrice(String(p.price));
        setDescription(p.description ?? '');
        setCategoryId(p.category_id ? String(p.category_id) : '');
        setIsAvailable(p.is_available);
        setExistingImage(p.image ?? '');
        // Load existing product attributes and assign stable _key values
        const loaded: ProductAttr[] = (p.attributes ?? []).map((a: any, i: number) => ({
          ...a,
          _key: i,
        }));
        setProductAttrs(loaded);
        setKeyCounter(loaded.length);
      }
      if (cRes.status === 200) setCategories(cRes.data.data);
      if (aRes.status === 200) setAllAttrs(aRes.data.data);
      setLoading(false);
    });
  }, [id]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const n = asset.uri.split('/').pop() ?? 'image.jpg';
      const t = asset.mimeType ?? 'image/jpeg';
      setNewImage({ uri: asset.uri, name: n, type: t });
    }
  };

  const addAttr = (attr: GlobalAttr) => {
    const newAttr: ProductAttr = {
      _key: keyCounter,
      source: attr.is_system ? 'predefined' : 'custom',
      predefined_id: attr.is_system ? attr.id : null,
      label: attr.name,
      type: attr.type,
      required: false,
      values: attr.type === 'select' ? attr.values.map(v => ({ label: v, price: 0 })) : [],
    };
    setKeyCounter(k => k + 1);
    setProductAttrs(prev => [...prev, newAttr]);
  };

  const updateAttr = (idx: number, updated: ProductAttr) => {
    setProductAttrs(prev => prev.map((a, i) => i === idx ? updated : a));
  };

  const removeAttr = (idx: number) => {
    setProductAttrs(prev => prev.filter((_, i) => i !== idx));
  };

  const addedLabels = new Set(productAttrs.map(a => a.label.toLowerCase()));

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Product name is required.';
    if (!price || isNaN(Number(price))) errs.price = 'Valid price is required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('price', price);
    if (description.trim()) formData.append('description', description.trim());
    if (categoryId) formData.append('category_id', categoryId);
    formData.append('is_available', isAvailable ? '1' : '0');
    if (newImage) {
      formData.append('image', { uri: newImage.uri, name: newImage.name, type: newImage.type } as any);
    }
    // Always send attributes (empty array clears them)
    const attrsForApi = productAttrs.map(({ _key, ...rest }) => rest);
    formData.append('attributes', JSON.stringify(attrsForApi));

    const res = await api.updateProduct(Number(id), formData);
    setSaving(false);

    if (res.status === 200) {
      router.back();
    } else {
      const apiErrors = res.data?.errors ?? {};
      const mapped: Record<string, string> = {};
      Object.entries(apiErrors).forEach(([k, v]) => {
        mapped[k] = Array.isArray(v) ? v[0] : String(v);
      });
      setErrors(mapped);
      if (!Object.keys(mapped).length) {
        Alert.alert('Error', res.data?.message ?? 'Failed to update product.');
      }
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const imageUri = newImage?.uri ?? existingImage;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white border-b border-gray-100 px-4 py-3 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="font-semibold text-base text-gray-900">Edit Product</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="px-4 py-4 gap-5">

          {/* Image */}
          <TouchableOpacity onPress={pickImage} className="items-center">
            <View className="w-28 h-28 rounded-2xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 items-center justify-center">
              {imageUri ? (
                <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Text className="text-4xl">📷</Text>
              )}
            </View>
            <Text className="text-xs text-gray-400 mt-2">Tap to change photo</Text>
          </TouchableOpacity>

          {/* Name */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1.5">
              Product Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholderTextColor="#9CA3AF"
              className="w-full px-4 py-3.5 border rounded-2xl text-sm text-gray-900 bg-white"
              style={{ borderColor: errors.name ? '#EF4444' : '#D1D5DB' }}
            />
            {errors.name && <Text className="text-red-500 text-xs mt-1">{errors.name}</Text>}
          </View>

          {/* Price */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1.5">
              Price <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholderTextColor="#9CA3AF"
              className="w-full px-4 py-3.5 border rounded-2xl text-sm text-gray-900 bg-white"
              style={{ borderColor: errors.price ? '#EF4444' : '#D1D5DB' }}
            />
            {errors.price && <Text className="text-red-500 text-xs mt-1">{errors.price}</Text>}
          </View>

          {/* Category */}
          {categories.length > 0 && (
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setCategoryId('')}
                    className={`px-3 py-2 rounded-2xl border ${!categoryId ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`text-xs font-medium ${!categoryId ? 'text-white' : 'text-gray-600'}`}>None</Text>
                  </TouchableOpacity>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setCategoryId(String(cat.id))}
                      className={`px-3 py-2 rounded-2xl border ${categoryId === String(cat.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'}`}
                    >
                      <Text className={`text-xs font-medium ${categoryId === String(cat.id) ? 'text-white' : 'text-gray-600'}`}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Description */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
              className="w-full px-4 py-3.5 border border-gray-300 rounded-2xl text-sm text-gray-900 bg-white"
              style={{ textAlignVertical: 'top', minHeight: 90 }}
            />
          </View>

          {/* Attributes */}
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-sm font-medium text-gray-700">Attributes</Text>
                <Text className="text-xs text-gray-400">Options buyers choose at order time</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPickerVisible(true)}
                className="flex-row items-center gap-1 px-3 py-1.5 bg-indigo-50 rounded-xl"
              >
                <Text className="text-indigo-600 text-sm font-semibold">+ Add</Text>
              </TouchableOpacity>
            </View>

            {productAttrs.length === 0 ? (
              <TouchableOpacity
                onPress={() => setPickerVisible(true)}
                className="border-2 border-dashed border-gray-200 rounded-2xl py-6 items-center"
              >
                <Text className="text-2xl mb-1">🎛️</Text>
                <Text className="text-gray-400 text-sm">Tap to add attributes</Text>
                <Text className="text-gray-300 text-xs mt-0.5">e.g. Size, Flavour, custom text</Text>
              </TouchableOpacity>
            ) : (
              <View className="gap-3">
                {productAttrs.map((attr, idx) => (
                  <ProductAttrCard
                    key={attr._key}
                    attr={attr}
                    onChange={updated => updateAttr(idx, updated)}
                    onRemove={() => removeAttr(idx)}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Availability */}
          <View className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-medium text-gray-900">Available</Text>
              <Text className="text-xs text-gray-500">Show to customers</Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving}
            className="bg-indigo-600 rounded-2xl py-4 items-center mb-4"
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Save Changes</Text>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>

      <AttrPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        allAttrs={allAttrs}
        addedLabels={addedLabels}
        onAdd={addAttr}
      />
    </SafeAreaView>
  );
}
