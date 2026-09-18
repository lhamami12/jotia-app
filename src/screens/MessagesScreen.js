import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { subscribeToMyConversations, deleteConversationForUser } from '../services/chat';
import { useTranslation } from 'react-i18next';

export default function MessagesScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToMyConversations(user.uid, setConversations);
    return unsubscribe;
  }, [user]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.sectionTitle}>{t('messages.title')}</Text>
        <View style={styles.center}>
          <Text style={styles.emIcon}>🔒</Text>
          <Text style={styles.centerText}>{t('messages.loginNeeded')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.sectionTitle}>{t('messages.title')}</Text>
      <FlatList
        data={conversations}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emIcon}>📭</Text>
            <Text style={styles.centerText}>{t('messages.emptyTitle')}</Text>
            <Text style={styles.centerSub}>{t('messages.emptySub')}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const otherPhone = item.sellerId === user.uid ? item.buyerPhone : item.sellerPhone;
          const unreadCount = item.unreadCounts?.[user.uid] || 0;
          const handleDelete = () => {
            Alert.alert(
              t('messages.deleteTitle'),
              t('messages.deleteMsg'),
              [
                { text: t('messages.cancel'), style: 'cancel' },
                {
                  text: t('messages.delete'),
                  style: 'destructive',
                  onPress: () => deleteConversationForUser(item.id, user.uid).catch(() => {}),
                },
              ]
            );
          };
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('Chat', {
                conversationId: item.id,
                otherPhone,
                listing: { id: item.listingId, title: item.listingTitle },
              })}
            >
              <View style={styles.avatar}><Text>{item.listingEmoji || '📦'}</Text></View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{item.listingTitle}</Text>
                  {unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.lastMsg} numberOfLines={1}>{item.lastMessage || t('messages.startChat')}</Text>
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tarp },
  sectionTitle: { color: colors.mustard, fontSize: 18, fontWeight: '900', padding: 20, paddingBottom: 4 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 8, padding: 60 },
  emIcon: { fontSize: 36 },
  centerText: { color: colors.paper, fontWeight: '700', fontSize: 14 },
  centerSub: { color: colors.paper, opacity: 0.7, fontSize: 12.5 },
  card: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, backgroundColor: colors.kraft, borderRadius: 14, padding: 12, marginBottom: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '700', fontSize: 13.5, color: colors.ink, textAlign: 'right' },
  lastMsg: { fontSize: 12, color: '#8a8378', textAlign: 'right', marginTop: 2 },
  titleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  badge: { backgroundColor: colors.marker, borderRadius: 10, minWidth: 20, height: 20, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: colors.paper, fontSize: 10.5, fontWeight: '900' },
  deleteBtn: { padding: 6 },
  deleteIcon: { fontSize: 16 },
});
