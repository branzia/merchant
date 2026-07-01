import { Tabs, usePathname, useRouter } from 'expo-router';
import {
  View, Text, TouchableOpacity, Animated, Image, Alert, Linking, useWindowDimensions,
} from 'react-native';
import { useRef, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerProvider, useDrawer } from '@/context/DrawerContext';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as api from '@/services/api';
import { api as appApi, ui, app } from '@/config';
import { useIsTablet } from '@/hooks/useIsTablet';

const SIDEBAR_WIDTH = 260;

const PRIMARY_NAV = [
  { href: '/(tabs)',          label: 'Home',     iconOff: 'home-outline'     as const, iconOn: 'home'     as const, match: (p: string) => p === '/' },
  { href: '/(tabs)/orders',   label: 'Orders',   iconOff: 'receipt-outline'  as const, iconOn: 'receipt'  as const, match: (p: string) => p.startsWith('/orders') },
  { href: '/(tabs)/products', label: 'Products', iconOff: 'bag-outline'      as const, iconOn: 'bag'      as const, match: (p: string) => p.startsWith('/products') },
  { href: '/(tabs)/settings', label: 'Settings', iconOff: 'settings-outline' as const, iconOn: 'settings' as const, match: (p: string) => p.startsWith('/settings') },
];

const SECONDARY_NAV = [
  { href: '/(tabs)/categories', label: 'Categories', iconOff: 'pricetag-outline' as const, iconOn: 'pricetag' as const, match: (p: string) => p.startsWith('/categories') },
  { href: '/(tabs)/attributes', label: 'Attributes',  iconOff: 'options-outline'  as const, iconOn: 'options'  as const, match: (p: string) => p.startsWith('/attributes') },
];

// ─── Tablet Sidebar ───────────────────────────────────────────────────────────

function TabletSidebar({ pendingCount }: { pendingCount: number }) {
  const { merchant, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const go = (href: string) => router.push(href as any);

  return (
    <View style={{
      width: SIDEBAR_WIDTH,
      backgroundColor: '#FFFFFF',
      borderRightWidth: 1,
      borderRightColor: '#F3F4F6',
      paddingTop: insets.top + 8,
      paddingBottom: insets.bottom + 8,
    }}>
      {/* Store header */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          {merchant?.logo ? (
            <Image source={{ uri: merchant.logo }} style={{ width: 38, height: 38, borderRadius: 19, flexShrink: 0 }} />
          ) : (
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: ui.accent }}>
                {(merchant?.shop_name ?? 'B')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }} numberOfLines={2}>
              {merchant?.shop_name ?? 'My Store'}
            </Text>
            {merchant?.slug && (
              <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }} numberOfLines={1}>
                branzia.app/{merchant.slug}
              </Text>
            )}
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 4,
            paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
            backgroundColor: merchant?.is_open ? '#F0FDF4' : '#FEF2F2',
          }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: merchant?.is_open ? '#22C55E' : '#EF4444' }} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: merchant?.is_open ? '#15803D' : '#DC2626' }}>
              {merchant?.is_open ? 'Open' : 'Closed'}
            </Text>
          </View>
          {merchant?.slug && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`${appApi.storeBaseUrl}/${merchant.slug}`)}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, backgroundColor: '#EEF2FF' }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: ui.accent }}>Store ↗</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Primary nav */}
      <View style={{ flex: 1, paddingHorizontal: 10 }}>
        {PRIMARY_NAV.map(item => {
          const active = item.match(pathname);
          return (
            <TouchableOpacity
              key={item.href}
              onPress={() => go(item.href)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 16,
                paddingHorizontal: 14, paddingVertical: 14,
                borderRadius: 14, marginBottom: 2,
                backgroundColor: active ? '#EEF2FF' : 'transparent',
              }}
            >
              <Ionicons name={active ? item.iconOn : item.iconOff} size={20} color={active ? ui.accent : '#6B7280'} />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: active ? '700' : '500', color: active ? ui.accent : '#374151' }}>
                {item.label}
              </Text>
              {item.label === 'Orders' && pendingCount > 0 && (
                <View style={{ backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, minWidth: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{pendingCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Secondary nav */}
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
          <Text style={{ paddingHorizontal: 14, fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
            More
          </Text>
          {SECONDARY_NAV.map(item => {
            const active = item.match(pathname);
            return (
              <TouchableOpacity
                key={item.href}
                onPress={() => go(item.href)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 16,
                  paddingHorizontal: 14, paddingVertical: 14,
                  borderRadius: 14, marginBottom: 2,
                  backgroundColor: active ? '#EEF2FF' : 'transparent',
                }}
              >
                <Ionicons name={active ? item.iconOn : item.iconOff} size={20} color={active ? ui.accent : '#6B7280'} />
                <Text style={{ flex: 1, fontSize: 14, fontWeight: active ? '700' : '500', color: active ? ui.accent : '#374151' }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Bottom */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
        {app.features.billing && merchant?.subscription_plan && (
          <TouchableOpacity
            onPress={() => router.push('/subscription' as any)}
            activeOpacity={0.75}
            style={{ backgroundColor: '#EEF2FF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: ui.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {merchant.subscription_plan} plan
              </Text>
              {merchant.plan_days_remaining != null && (
                <Text style={{ fontSize: 11, color: '#818CF8', marginTop: 2 }}>
                  {merchant.plan_days_remaining > 0 ? `${merchant.plan_days_remaining} days left` : 'Expired'}
                </Text>
              )}
            </View>
            <Text style={{ fontSize: 12, color: ui.accent, fontWeight: '600' }}>↗</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, backgroundColor: '#FEF2F2' }}
        >
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#DC2626' }}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Phone Drawer ─────────────────────────────────────────────────────────────

const DRAWER_NAV_ITEMS = [
  { href: '/(tabs)/categories', label: 'Categories', emoji: '🏷️', match: '/categories' },
  { href: '/(tabs)/attributes', label: 'Attributes',  emoji: '🎛️', match: '/attributes' },
];

function DrawerPanel() {
  const { isOpen, closeDrawer } = useDrawer();
  const { merchant, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const drawerWidth = Math.min(windowWidth * 0.82, 320);

  const translateX = useRef(new Animated.Value(-drawerWidth)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, { toValue: isOpen ? 0 : -drawerWidth, duration: 260, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: isOpen ? 1 : 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [isOpen]);

  const navigate = (href: string) => { closeDrawer(); router.push(href as any); };

  const handleLogout = () => {
    closeDrawer();
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <>
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

      <Animated.View
        style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: drawerWidth,
          backgroundColor: '#FFFFFF',
          zIndex: 101,
          transform: [{ translateX }],
          shadowColor: '#000',
          shadowOffset: { width: 6, height: 0 },
          shadowOpacity: 0.10,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        <View style={{ flex: 1, paddingTop: insets.top + 12 }}>

          <View style={{ paddingHorizontal: 20, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              {merchant?.logo ? (
                <Image source={{ uri: merchant.logo }} style={{ width: 52, height: 52, borderRadius: 26 }} />
              ) : (
                <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: ui.accent }}>
                    {(merchant?.shop_name ?? 'B')[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }} numberOfLines={1}>
                  {merchant?.shop_name ?? 'My Store'}
                </Text>
                {merchant?.slug && (
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                    branzia.app/{merchant.slug}
                  </Text>
                )}
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
                backgroundColor: merchant?.is_open ? '#F0FDF4' : '#FEF2F2',
              }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: merchant?.is_open ? '#22C55E' : '#EF4444' }} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: merchant?.is_open ? '#15803D' : '#DC2626' }}>
                  {merchant?.is_open ? 'Open' : 'Closed'}
                </Text>
              </View>
              {merchant?.slug && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`${appApi.storeBaseUrl}/${merchant.slug}`)}
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: '#EEF2FF' }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: ui.accent }}>Visit Store</Text>
                  <Text style={{ fontSize: 10, color: '#818CF8' }}>↗</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              More
            </Text>
          </View>

          <View style={{ paddingHorizontal: 10 }}>
            {DRAWER_NAV_ITEMS.map(item => {
              const active = pathname.startsWith(item.match);
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
                  <Text style={{ fontSize: 19 }}>{item.emoji}</Text>
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: active ? '700' : '500', color: active ? ui.accent : '#374151' }}>
                    {item.label}
                  </Text>
                  {active && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: ui.accent }} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ flex: 1 }} />

          <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
            {app.features.billing && merchant?.subscription_plan && (
              <TouchableOpacity
                onPress={() => { closeDrawer(); router.push('/subscription' as any); }}
                activeOpacity={0.75}
                style={{ backgroundColor: '#EEF2FF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: ui.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                <Text style={{ fontSize: 13, color: ui.accent, fontWeight: '600' }}>Upgrade ↗</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: '#FEF2F2' }}
            >
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#DC2626' }}>Sign Out</Text>
            </TouchableOpacity>
          </View>

        </View>
      </Animated.View>
    </>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const isTablet = useIsTablet();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    api.getDashboard().then(res => {
      if (res.status === 200) {
        setPendingCount(res.data.status_counts?.pending ?? 0);
      }
    });
  }, []);

  const tabBarHeight = 56 + Math.max(insets.bottom, 8);

  return (
    <DrawerProvider>
      <View style={{ flex: 1, flexDirection: isTablet ? 'row' : 'column' }}>

        {isTablet && <TabletSidebar pendingCount={pendingCount} />}

        <View style={{ flex: 1 }}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: isTablet ? { display: 'none' } : {
                backgroundColor: '#FFFFFF',
                borderTopWidth: 1,
                borderTopColor: '#F3F4F6',
                paddingTop: 6,
                paddingBottom: Math.max(insets.bottom, 8),
                height: tabBarHeight,
                elevation: 4,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: -2 },
              },
              tabBarActiveTintColor: ui.accent,
              tabBarInactiveTintColor: ui.placeholderText,
              tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 1 },
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: 'Home',
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="orders"
              options={{
                title: 'Orders',
                tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
                tabBarBadgeStyle: {
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: 10,
                  fontWeight: '700',
                  minWidth: 18,
                  height: 18,
                  lineHeight: 14,
                  paddingHorizontal: 4,
                },
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={22} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="products"
              options={{
                title: 'Products',
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons name={focused ? 'bag' : 'bag-outline'} size={22} color={color} />
                ),
              }}
            />
            <Tabs.Screen name="categories" options={{ href: null }} />
            <Tabs.Screen name="attributes" options={{ href: null }} />
            <Tabs.Screen
              name="settings"
              options={{
                title: 'Settings',
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} />
                ),
              }}
            />
          </Tabs>
        </View>

        {!isTablet && <DrawerPanel />}

      </View>
    </DrawerProvider>
  );
}
