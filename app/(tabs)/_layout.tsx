import { Tabs, usePathname, useRouter } from 'expo-router';
import {
  View, Text, TouchableOpacity, Animated, Dimensions, Image, Alert,
} from 'react-native';
import { useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerProvider, useDrawer } from '@/context/DrawerContext';
import { useAuth } from '@/context/AuthContext';

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.82, 320);

const NAV_ITEMS = [
  { href: '/(tabs)/',           label: 'Home',        emoji: '🏠', match: '/'           },
  { href: '/(tabs)/orders',     label: 'Orders',      emoji: '📋', match: '/orders'     },
  { href: '/(tabs)/products',   label: 'Products',    emoji: '📦', match: '/products'   },
  { href: '/(tabs)/categories', label: 'Categories',  emoji: '🏷️', match: '/categories' },
  { href: '/(tabs)/attributes', label: 'Attributes',  emoji: '🎛️', match: '/attributes' },
  { href: '/(tabs)/settings',   label: 'Settings',    emoji: '⚙️', match: '/settings'   },
];

function DrawerPanel() {
  const { isOpen, closeDrawer } = useDrawer();
  const { merchant, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: isOpen ? 0 : -DRAWER_WIDTH,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: isOpen ? 1 : 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen]);

  const navigate = (href: string) => {
    closeDrawer();
    router.push(href as any);
  };

  const handleLogout = () => {
    closeDrawer();
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          opacity: backdropOpacity,
          zIndex: 100,
        }}
      >
        <TouchableOpacity style={{ flex: 1 }} onPress={closeDrawer} activeOpacity={1} />
      </Animated.View>

      {/* Slide panel */}
      <Animated.View
        style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: DRAWER_WIDTH,
          backgroundColor: '#FFFFFF',
          zIndex: 101,
          transform: [{ translateX }],
          shadowColor: '#000',
          shadowOffset: { width: 6, height: 0 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        <View style={{ flex: 1, paddingTop: insets.top + 12 }}>

          {/* ── Store header ── */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              {merchant?.logo ? (
                <Image
                  source={{ uri: merchant.logo }}
                  style={{ width: 54, height: 54, borderRadius: 27 }}
                />
              ) : (
                <View style={{
                  width: 54, height: 54, borderRadius: 27,
                  backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: '#4F46E5' }}>
                    {(merchant?.shop_name ?? 'B')[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }} numberOfLines={1}>
                  {merchant?.shop_name ?? 'My Store'}
                </Text>
                {merchant?.slug && (
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                    branzia.app/{merchant.slug}
                  </Text>
                )}
              </View>
            </View>

            {/* Open / Closed status + Visit Store */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                backgroundColor: merchant?.is_open ? '#F0FDF4' : '#FEF2F2',
              }}>
                <View style={{
                  width: 6, height: 6, borderRadius: 3,
                  backgroundColor: merchant?.is_open ? '#22C55E' : '#EF4444',
                }} />
                <Text style={{
                  fontSize: 12, fontWeight: '600',
                  color: merchant?.is_open ? '#15803D' : '#DC2626',
                }}>
                  {merchant?.is_open ? 'Open' : 'Closed'}
                </Text>
              </View>
              {merchant?.slug && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`https://branzia.app/store/${merchant.slug}`)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 5,
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                    backgroundColor: '#EEF2FF',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#4F46E5' }}>Visit Store</Text>
                  <Text style={{ fontSize: 10, color: '#6366F1' }}>↗</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── Nav items ── */}
          <View style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 10 }}>
            {NAV_ITEMS.map(item => {
              const active = item.match === '/'
                ? pathname === '/'
                : pathname.startsWith(item.match);
              return (
                <TouchableOpacity
                  key={item.href}
                  onPress={() => navigate(item.href)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 14,
                    paddingHorizontal: 16, paddingVertical: 13,
                    borderRadius: 14, marginBottom: 2,
                    backgroundColor: active ? '#EEF2FF' : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
                  <Text style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: active ? '700' : '500',
                    color: active ? '#4F46E5' : '#374151',
                  }}>
                    {item.label}
                  </Text>
                  {active && (
                    <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#4F46E5' }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Footer ── */}
          <View style={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 20,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: '#F3F4F6',
          }}>
            {merchant?.subscription_plan && (
              <TouchableOpacity
                onPress={() => {
                  closeDrawer();
                  router.push('/subscription' as any);
                }}
                activeOpacity={0.75}
                style={{
                  backgroundColor: '#EEF2FF', borderRadius: 14,
                  paddingHorizontal: 14, paddingVertical: 11, marginBottom: 14,
                  flexDirection: 'row', alignItems: 'center',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {merchant.subscription_plan} plan
                  </Text>
                  {merchant.plan_days_remaining != null && (
                    <Text style={{ fontSize: 11, color: '#818CF8', marginTop: 2 }}>
                      {merchant.plan_days_remaining > 0
                        ? `${merchant.plan_days_remaining} days remaining`
                        : 'Expired — tap to renew'}
                    </Text>
                  )}
                </View>
                <Text style={{ fontSize: 13, color: '#6366F1', fontWeight: '600' }}>Upgrade ↗</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                paddingHorizontal: 16, paddingVertical: 12,
                borderRadius: 14, backgroundColor: '#FEF2F2',
              }}
            >
              <Text style={{ fontSize: 18 }}>🚪</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#DC2626' }}>Logout</Text>
            </TouchableOpacity>
          </View>

        </View>
      </Animated.View>
    </>
  );
}

export default function TabsLayout() {
  return (
    <DrawerProvider>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="orders" />
          <Tabs.Screen name="products" />
          <Tabs.Screen name="categories" />
          <Tabs.Screen name="attributes" />
          <Tabs.Screen name="settings" />
        </Tabs>
        <DrawerPanel />
      </View>
    </DrawerProvider>
  );
}
