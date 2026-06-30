import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import * as api from '@/services/api';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [loginVal, setLoginVal] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!loginVal.trim() || !password) {
      setError('Please enter your email/phone and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.login(loginVal.trim(), password);
      if (res.status === 200) {
        await signIn(res.data.token, res.data.merchant);
      } else if (res.status === 403) {
        setError('Your account has been suspended.');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">

          {/* Logo */}
          <View className="items-center mb-10">
            <View className="w-24 h-24 rounded-3xl overflow-hidden mb-4">
              <Image
                source={require('@/assets/icon.png')}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
            <Text className="text-2xl font-bold text-gray-900">Branzia Merchant</Text>
            <Text className="text-sm text-gray-500 mt-1">Sign in to manage your store</Text>
          </View>

          {/* Error */}
          {!!error && (
            <View className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4">
              <Text className="text-red-700 text-sm">{error}</Text>
            </View>
          )}

          {/* Form */}
          <View className="gap-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Email or Phone</Text>
              <TextInput
                value={loginVal}
                onChangeText={setLoginVal}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="w-full px-4 py-3.5 border border-gray-300 rounded-2xl text-sm bg-white text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Password</Text>
              <View className="relative">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  className="w-full px-4 py-3.5 border border-gray-300 rounded-2xl text-sm bg-white text-gray-900 pr-12"
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  onPress={() => setShowPass(!showPass)}
                  className="absolute right-3 top-3.5"
                >
                  <Text className="text-gray-400 text-sm">{showPass ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="bg-indigo-600 rounded-2xl py-4 items-center mt-2 active:bg-indigo-700"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            className="items-center mt-6"
          >
            <Text className="text-gray-500 text-sm">
              Want to open a shop?{' '}
              <Text className="text-indigo-600 font-medium">Get started</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
