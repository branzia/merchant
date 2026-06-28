import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Keyboard,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';

const PLANS = ['Starter', 'Growth', 'Pro'] as const;
type Plan = (typeof PLANS)[number];

const WA_NUMBER = '917358720104';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState<Plan>('Starter');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const scrollRef = useRef<ScrollView>(null);
  const messageFocused = useRef(false);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      if (messageFocused.current) {
        scrollRef.current?.scrollToEnd({ animated: true });
      }
    });
    return () => sub.remove();
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!shopName.trim()) e.shopName = 'Shop name is required';
    if (!email.trim()) {
      e.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = 'Enter a valid email address';
    }
    if (!phone.trim()) {
      e.phone = 'Phone number is required';
    } else if (!/^[+\d][\d\s\-()+]{6,19}$/.test(phone.trim())) {
      e.phone = 'Enter a valid phone number';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSend = async () => {
    if (!validate()) return;

    const lines = [
      "Hi Branzia! I'd like to open my shop.",
      '',
      `Name: ${name.trim()}`,
      `Shop Name: ${shopName.trim()}`,
      `Email: ${email.trim()}`,
      `Phone: ${phone.trim()}`,
      `Plan: ${plan}`,
    ];
    if (message.trim()) lines.push(`Message: ${message.trim()}`);

    const text = encodeURIComponent(lines.join('\n'));
    const waUrl = `https://wa.me/${WA_NUMBER}?text=${text}`;
    const webUrl = `https://web.whatsapp.com/send?phone=${WA_NUMBER}&text=${text}`;

    const canOpen = await Linking.canOpenURL(waUrl);
    await Linking.openURL(canOpen ? waUrl : webUrl);
    setSent(true);
  };

  if (sent) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-6">
          <Text className="text-5xl">✅</Text>
        </View>
        <Text className="text-2xl font-bold text-gray-900 text-center mb-3">Request Sent!</Text>
        <Text className="text-gray-500 text-center text-base leading-6 px-4">
          Your request has been sent! Our team will contact you within 24 hours.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          className="mt-8 bg-indigo-600 rounded-2xl px-8 py-4"
        >
          <Text className="text-white font-semibold text-base">Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 py-12">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-green-500 rounded-3xl items-center justify-center mb-5 shadow-lg">
              <Text className="text-4xl">🛍️</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">Open Your Shop</Text>
            <Text className="text-sm text-gray-500 mt-1 text-center px-4">
              Fill in your details and we'll get you set up via WhatsApp
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <Field
              label="Full Name"
              required
              value={name}
              onChangeText={t => { setName(t); setErrors(e => ({ ...e, name: '' })); }}
              placeholder="Ravi Kumar"
              error={errors.name}
            />

            <Field
              label="Shop Name"
              required
              value={shopName}
              onChangeText={t => { setShopName(t); setErrors(e => ({ ...e, shopName: '' })); }}
              placeholder="Ravi Cakes"
              error={errors.shopName}
            />

            <Field
              label="Email"
              required
              value={email}
              onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: '' })); }}
              placeholder="ravi@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              secureTextEntry={false}
              textContentType="emailAddress"
              error={errors.email}
            />

            <Field
              label="Phone"
              required
              value={phone}
              onChangeText={t => { setPhone(t); setErrors(e => ({ ...e, phone: '' })); }}
              placeholder="+91 9876543210"
              keyboardType="phone-pad"
              error={errors.phone}
            />

            {/* Plan picker */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Plan *</Text>
              <View className="flex-row gap-2">
                {PLANS.map(p => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPlan(p)}
                    className={`flex-1 py-3 rounded-2xl items-center border ${
                      plan === p
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        plan === p ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Optional message */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                Message{' '}
                <Text className="text-gray-400 font-normal">(optional)</Text>
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Tell us about your business…"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="w-full px-4 py-3.5 border border-gray-300 rounded-2xl text-sm bg-white text-gray-900"
                placeholderTextColor="#9CA3AF"
                onFocus={() => {
                  messageFocused.current = true;
                  // also handles the case where keyboard is already open
                  scrollRef.current?.scrollToEnd({ animated: true });
                }}
                onBlur={() => { messageFocused.current = false; }}
              />
            </View>

            <TouchableOpacity
              onPress={handleSend}
              className="bg-green-500 rounded-2xl py-4 items-center mt-2 active:bg-green-600 flex-row justify-center gap-2"
            >
              <Text className="text-xl">💬</Text>
              <Text className="text-white font-semibold text-base ml-1">
                Send via WhatsApp
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              className="items-center py-3"
            >
              <Text className="text-indigo-600 text-sm font-medium">
                Already have an account? Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  required,
  error,
  ...props
}: {
  label: string;
  required?: boolean;
  error?: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Text className="text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required ? ' *' : ''}
      </Text>
      <TextInput
        {...props}
        className={`w-full px-4 py-3.5 border rounded-2xl text-sm bg-white text-gray-900 ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
        placeholderTextColor="#9CA3AF"
      />
      {!!error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
    </View>
  );
}
