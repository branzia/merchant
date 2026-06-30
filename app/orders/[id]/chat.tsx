import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { ui } from '@/config';
import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Message {
  id: number;
  sender: 'merchant' | 'buyer';
  message: string;
  read_at: string | null;
  created_at: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function OrderChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { merchant } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMessages = async (markRead = false) => {
    const res = await api.getMessages(Number(id));
    if (res.status === 200) {
      setMessages(res.data.data);
      if (markRead) {
        api.markMessagesRead(Number(id));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMessages(true);
    pollRef.current = setInterval(() => loadMessages(false), 12000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    const res = await api.sendMessage(Number(id), trimmed);
    setSending(false);
    if (res.status === 201) {
      setMessages((prev) => [...prev, res.data]);
    } else {
      setText(trimmed);
      Alert.alert('Error', res.data?.message ?? 'Failed to send message.');
    }
  };

  // Group messages by date
  type ListItem = { type: 'date'; date: string } | { type: 'message'; item: Message };
  const listData: ListItem[] = [];
  let lastDate = '';
  for (const msg of messages) {
    const d = formatDate(msg.created_at);
    if (d !== lastDate) {
      listData.push({ type: 'date', date: d });
      lastDate = d;
    }
    listData.push({ type: 'message', item: msg });
  }

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'date') {
      return (
        <View className="items-center my-3">
          <View className="bg-gray-100 rounded-full px-3 py-1">
            <Text className="text-xs text-gray-500 font-medium">{item.date}</Text>
          </View>
        </View>
      );
    }

    const msg = item.item;
    const isMerchant = msg.sender === 'merchant';

    return (
      <View className={`flex-row mb-2 px-4 ${isMerchant ? 'justify-end' : 'justify-start'}`}>
        {!isMerchant && (
          <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center mr-2 mt-1 shrink-0">
            <Text className="text-xs font-bold text-gray-500">B</Text>
          </View>
        )}
        <View style={{ maxWidth: '75%' }}>
          <View
            className={`rounded-2xl px-4 py-2.5 ${isMerchant ? 'rounded-tr-sm bg-indigo-600' : 'rounded-tl-sm bg-white border border-gray-100'}`}
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
          >
            <Text className={`text-sm ${isMerchant ? 'text-white' : 'text-gray-900'}`}>
              {msg.message}
            </Text>
          </View>
          <View className={`flex-row items-center mt-0.5 gap-1 ${isMerchant ? 'justify-end' : 'justify-start'}`}>
            <Text className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</Text>
            {isMerchant && (
              <Text className="text-[10px] text-gray-400">{msg.read_at ? '✓✓' : '✓'}</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-100 px-4 py-3 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-semibold text-base text-gray-900">Order #{id} · Chat</Text>
          <Text className="text-xs text-gray-400">Message thread with buyer</Text>
        </View>
        <TouchableOpacity onPress={() => loadMessages(false)}>
          <Text className="text-indigo-600 text-sm font-medium">Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={ui.accent} />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={listData}
            keyExtractor={(item, idx) =>
              item.type === 'date' ? `date-${item.date}-${idx}` : `msg-${item.item.id}`
            }
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 12, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-20">
                <Text className="text-5xl mb-3">💬</Text>
                <Text className="text-gray-500 font-medium">No messages yet</Text>
                <Text className="text-gray-400 text-sm mt-1">Start the conversation below</Text>
              </View>
            }
          />

          {/* Input bar */}
          <View
            className="bg-white border-t border-gray-100 px-3 py-2 flex-row items-end gap-2"
            style={{ paddingBottom: Platform.OS === 'ios' ? 8 : 12 }}
          >
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={1000}
              className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-900"
              style={{ maxHeight: 100 }}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!text.trim() || sending}
              className="w-10 h-10 bg-indigo-600 rounded-full items-center justify-center"
              style={{ opacity: !text.trim() || sending ? 0.5 : 1 }}
            >
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-lg" style={{ transform: [{ rotate: '45deg' }] }}>➤</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
