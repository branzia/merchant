import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import RazorpayCheckout from 'react-native-razorpay';
import * as api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomTabBar from '@/components/BottomTabBar';
import { planColors, ui, app } from '@/config';

type Cycle = 'monthly' | 'yearly';

interface Plan {
  key: string;
  name: string;
  products_limit: number | null;
  price_monthly: number;
  price_yearly: number;
  features: string[];
}

interface CurrentSub {
  plan: string;
  cycle: string;
  is_trial: boolean;
  plan_active: boolean;
  plan_days_remaining: number;
  expires_at: string;
}


export default function SubscriptionScreen() {
  const router = useRouter();
  const { merchant } = useAuth();

  // Billing is a Branzia-specific feature; redirect away if disabled in config
  useEffect(() => {
    if (!app.features.billing) router.replace('/(tabs)/settings' as any);
  }, []);

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState<CurrentSub | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState('');
  const [cycle, setCycle] = useState<Cycle>('monthly');
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    api.getSubscription().then((res) => {
      if (res.status === 200) {
        const d = res.data.data ?? res.data;
        const rawPlans: Record<string, any> = d.plans ?? {};
        const plansArr: Plan[] = Object.entries(rawPlans).map(([key, p]: [string, any]) => ({
          key,
          name: p.label ?? key,
          products_limit: p.products ?? null,
          price_monthly: p.monthly_price ?? 0,
          price_yearly: p.yearly_price ?? 0,
          features: p.features ?? [],
        }));
        setPlans(plansArr);
        setCurrent({
          plan: d.plan ?? '',
          cycle: d.billing_cycle ?? 'monthly',
          is_trial: d.is_trial ?? false,
          plan_active: d.plan_active ?? false,
          plan_days_remaining: d.days_remaining ?? 0,
          expires_at: d.plan_expires_at ?? '',
        });
        setCurrencySymbol(d.currency_symbol ?? merchant?.currency_symbol ?? '');
      } else {
        Alert.alert('Error', 'Could not load plans. Please try again.');
      }
      setLoading(false);
    });
  }, []);

  const handleSubscribe = async (plan: Plan) => {
    if (subscribing) return;
    setSubscribing(plan.key);

    try {
      const initRes = await api.initiateSubscription(plan.key, cycle);
      if (initRes.status !== 200 && initRes.status !== 201) {
        Alert.alert('Error', initRes.data?.message ?? 'Failed to initiate payment.');
        setSubscribing(null);
        return;
      }

      const rzpData = initRes.data;

      // Downgrade scheduled — no payment needed
      if (rzpData.type === 'scheduled') {
        Alert.alert(
          'Plan Change Scheduled',
          rzpData.message ?? `${rzpData.plan_label} plan will activate on ${rzpData.effective_at}.`,
          [{ text: 'OK', onPress: () => router.back() }],
        );
        setSubscribing(null);
        return;
      }

      // Ensure the native Razorpay module is available
      if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
        Alert.alert('Error', 'Payment module unavailable. Please rebuild the app and try again.');
        setSubscribing(null);
        return;
      }

      // Validate required Razorpay fields before opening checkout
      if (!rzpData.key_id || !rzpData.order_id || !rzpData.amount) {
        Alert.alert('Error', 'Invalid payment details received from server. Please try again.');
        setSubscribing(null);
        return;
      }

      // Payment required — open Razorpay checkout
      // Note: amount must be a string (paise) per Razorpay React Native SDK
      const paymentData = await RazorpayCheckout.open({
        description: rzpData.description ?? `${plan.name} Plan – ${cycle}`,
        currency: rzpData.currency ?? 'INR',
        key: rzpData.key_id,
        amount: String(rzpData.amount),
        name: 'Branzia',
        order_id: rzpData.order_id,
        prefill: rzpData.prefill ?? {
          name: merchant?.name ?? '',
          email: merchant?.email ?? '',
          contact: merchant?.phone ?? '',
        },
        theme: { color: app.razorpayThemeColor },
      });

      // Verify with backend
      const verifyRes = await api.verifySubscription({
        order_id: paymentData.razorpay_order_id,
        payment_id: paymentData.razorpay_payment_id,
        signature: paymentData.razorpay_signature,
      });

      if (verifyRes.status === 200) {
        Alert.alert(
          'Subscribed!',
          verifyRes.data?.message ?? `You are now on the ${plan.name} plan. Enjoy!`,
          [{ text: 'Done', onPress: () => router.back() }],
        );
      } else {
        Alert.alert('Payment Received', 'Your payment was received. Plan activation may take a moment — please refresh the app.');
        router.back();
      }
    } catch (err: any) {
      // code === 0 means the user cancelled — don't show an error
      if (err?.code === 0) return;
      // Razorpay errors have a numeric code; anything else is a native-module / JS error
      if (typeof err?.code === 'number') {
        Alert.alert('Payment Failed', err.description ?? 'Payment could not be completed. Please try again.');
      } else {
        Alert.alert('Error', 'Payment module unavailable. Please use a custom development build (not Expo Go) to test payments.');
      }
    } finally {
      setSubscribing(null);
    }
  };

  const yearlySavings = (plan: Plan) =>
    plan.price_monthly > 0
      ? Math.round(((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12)) * 100)
      : 0;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color={ui.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="bg-white border-b border-gray-100 px-4 py-3 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-bold text-lg text-gray-900">Choose a Plan</Text>
          <Text className="text-xs text-gray-400 mt-0.5">Grow your store with Branzia</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 py-4 gap-4">

          {/* Current plan banner */}
          {current && (
            <View className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 flex-row items-center gap-3">
              <View className="flex-1">
                <Text className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
                  {current.is_trial ? 'Trial' : 'Current Plan'}
                </Text>
                <Text className="text-sm font-bold text-indigo-900 capitalize mt-0.5">
                  {current.plan} · {current.cycle}
                </Text>
              </View>
              <View className="items-end">
                <View
                  className="px-2 py-0.5 rounded-full mb-1"
                  style={{ backgroundColor: current.plan_active ? '#D1FAE5' : '#FEE2E2' }}
                >
                  <Text
                    className="text-[10px] font-bold uppercase"
                    style={{ color: current.plan_active ? '#065F46' : '#991B1B' }}
                  >
                    {current.plan_active ? 'Active' : 'Expired'}
                  </Text>
                </View>
                <Text className="text-xs text-indigo-400">
                  {current.plan_days_remaining > 0
                    ? `${current.plan_days_remaining} days left`
                    : 'Expired'}
                </Text>
              </View>
            </View>
          )}

          {/* Billing cycle toggle */}
          <View className="bg-gray-100 rounded-2xl p-1 flex-row">
            {(['monthly', 'yearly'] as Cycle[]).map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCycle(c)}
                className="flex-1 items-center py-2.5 rounded-xl"
                style={{ backgroundColor: cycle === c ? '#FFFFFF' : 'transparent' }}
              >
                <Text
                  className="text-sm font-semibold capitalize"
                  style={{ color: cycle === c ? '#111827' : '#6B7280' }}
                >
                  {c}
                </Text>
                {c === 'yearly' && (
                  <Text className="text-[10px] font-bold text-green-600 mt-0.5">Save up to 17%</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Plan cards */}
          {plans.map((plan) => {
            const isCurrent = current?.plan === plan.key;
            const colors = planColors[plan.key] ?? planColors.starter;
            const price = cycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
            const savings = yearlySavings(plan);
            const isProcessing = subscribing === plan.key;

            return (
              <View
                key={plan.key}
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: colors.bg, borderWidth: isCurrent ? 2 : 1, borderColor: isCurrent ? colors.badge : colors.border }}
              >
                {/* Plan header */}
                <View className="px-4 pt-4 pb-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base font-bold capitalize" style={{ color: colors.text }}>
                        {plan.name}
                      </Text>
                      {isCurrent && (
                        <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.badge }}>
                          <Text className="text-[10px] font-bold text-white uppercase">Current</Text>
                        </View>
                      )}
                    </View>
                    {cycle === 'yearly' && savings > 0 && (
                      <View className="bg-green-100 px-2 py-0.5 rounded-full">
                        <Text className="text-[10px] font-bold text-green-700">Save {savings}%</Text>
                      </View>
                    )}
                  </View>

                  {/* Price */}
                  <View className="flex-row items-baseline gap-1 mt-1">
                    <Text className="text-3xl font-bold" style={{ color: colors.badge }}>
                      {currencySymbol}{price}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      /{cycle === 'monthly' ? 'mo' : 'yr'}
                    </Text>
                  </View>
                  {cycle === 'yearly' && (
                    <Text className="text-xs text-gray-400 mt-0.5">
                      {currencySymbol}{Math.round(price / 12)}/month billed annually
                    </Text>
                  )}
                </View>

                {/* Divider */}
                <View className="h-px mx-4" style={{ backgroundColor: colors.border }} />

                {/* Features */}
                <View className="px-4 py-3 gap-2">
                  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Includes
                  </Text>
                  {plan.features.length > 0 ? (
                    plan.features.map((feat) => (
                      <View key={feat} className="flex-row items-center gap-2">
                        <Text className="text-xs" style={{ color: colors.badge }}>✓</Text>
                        <Text className="text-sm text-gray-700">{feat}</Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-xs text-gray-400">
                      {plan.products_limit != null ? `Up to ${plan.products_limit} products` : 'Unlimited products'}
                    </Text>
                  )}
                </View>

                {/* Subscribe button */}
                <View className="px-4 pb-4">
                  <TouchableOpacity
                    onPress={() => !isCurrent && handleSubscribe(plan)}
                    disabled={isCurrent || !!subscribing}
                    className="rounded-xl py-3.5 items-center"
                    style={{
                      backgroundColor: isCurrent ? colors.border : colors.badge,
                      opacity: (!isCurrent && !!subscribing && !isProcessing) ? 0.5 : 1,
                    }}
                  >
                    {isProcessing ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text
                        className="font-semibold text-sm"
                        style={{ color: isCurrent ? colors.text : '#FFFFFF' }}
                      >
                        {isCurrent ? 'Your current plan' : `Subscribe to ${plan.name}`}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <Text className="text-xs text-gray-400 text-center pb-4">
            Payments are processed securely by Razorpay.{'\n'}
            You can upgrade or change your plan at any time.
          </Text>

        </View>
      </ScrollView>

      <BottomTabBar activeTab="settings" />
    </SafeAreaView>
  );
}
