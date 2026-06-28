import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export type TabName = 'home' | 'orders' | 'products' | 'settings';

const TABS: { name: TabName; label: string; icon: string; activeIcon: string; href: string }[] = [
  { name: 'home',     label: 'Home',     icon: 'home-outline',     activeIcon: 'home',     href: '/(tabs)/' },
  { name: 'orders',   label: 'Orders',   icon: 'receipt-outline',  activeIcon: 'receipt',  href: '/(tabs)/orders' },
  { name: 'products', label: 'Products', icon: 'bag-outline',      activeIcon: 'bag',      href: '/(tabs)/products' },
  { name: 'settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings', href: '/(tabs)/settings' },
];

export default function BottomTabBar({ activeTab }: { activeTab: TabName }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        height: 56 + Math.max(insets.bottom, 8),
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 6,
        paddingBottom: Math.max(insets.bottom, 8),
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -2 },
      }}
    >
      {TABS.map((tab) => {
        const active = tab.name === activeTab;
        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => router.push(tab.href as any)}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={(active ? tab.activeIcon : tab.icon) as any}
              size={22}
              color={active ? '#4F46E5' : '#9CA3AF'}
            />
            <Text style={{ fontSize: 11, fontWeight: '600', marginTop: 1, color: active ? '#4F46E5' : '#9CA3AF' }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
