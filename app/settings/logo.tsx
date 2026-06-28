import {
  View, Text, TouchableOpacity, Image, Alert, ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomTabBar from '@/components/BottomTabBar';

export default function LogoScreen() {
  const router = useRouter();
  const { merchant, refreshMerchant } = useAuth();
  const [newImage, setNewImage] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const name = asset.uri.split('/').pop() ?? 'logo.jpg';
      const type = asset.mimeType ?? 'image/jpeg';
      setNewImage({ uri: asset.uri, name, type });
    }
  };

  const handleUpload = async () => {
    if (!newImage) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('logo', { uri: newImage.uri, name: newImage.name, type: newImage.type } as any);

    const res = await api.uploadLogo(formData);
    setUploading(false);

    if (res.status === 200) {
      const updatedMerchant = { ...(merchant ?? {}), logo: res.data.logo };
      refreshMerchant(updatedMerchant);
      setNewImage(null);
      Alert.alert('Success', 'Logo uploaded successfully!');
    } else {
      Alert.alert('Error', res.data?.message ?? 'Failed to upload logo.');
    }
  };

  const displayUri = newImage?.uri ?? merchant?.logo;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <View className="bg-white border-b border-gray-100 px-4 py-3 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="font-semibold text-base text-gray-900">Store Logo</Text>
      </View>

      <View className="flex-1 items-center justify-center px-6">

        {/* Logo Preview */}
        <TouchableOpacity onPress={pickImage} className="mb-6">
          <View className="w-36 h-36 rounded-3xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 items-center justify-center">
            {displayUri ? (
              <Image source={{ uri: displayUri }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <View className="items-center gap-2">
                <Text className="text-5xl">🏪</Text>
                <Text className="text-xs text-gray-400">No logo</Text>
              </View>
            )}
          </View>
          <View className="absolute -bottom-2 -right-2 w-9 h-9 bg-indigo-600 rounded-full items-center justify-center shadow">
            <Text className="text-white text-lg">📷</Text>
          </View>
        </TouchableOpacity>

        <Text className="text-gray-700 font-medium text-base mb-1">
          {merchant?.shop_name ?? 'Your Store'}
        </Text>
        <Text className="text-gray-400 text-sm mb-8 text-center">
          {displayUri ? 'Tap the logo to change it' : 'Tap below to choose a logo image'}
        </Text>

        <TouchableOpacity
          onPress={pickImage}
          className="bg-white border border-gray-200 rounded-2xl py-3.5 px-6 mb-3 w-full items-center"
        >
          <Text className="text-gray-700 font-medium">Choose from Gallery</Text>
        </TouchableOpacity>

        {newImage && (
          <TouchableOpacity
            onPress={handleUpload}
            disabled={uploading}
            className="bg-indigo-600 rounded-2xl py-3.5 px-6 w-full items-center"
            style={{ opacity: uploading ? 0.7 : 1 }}
          >
            {uploading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">Upload Logo</Text>
            )}
          </TouchableOpacity>
        )}

        <Text className="text-xs text-gray-400 mt-4">Square image recommended · Max 5MB</Text>
      </View>

      <BottomTabBar activeTab="settings" />
    </SafeAreaView>
  );
}
