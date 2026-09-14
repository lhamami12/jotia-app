import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { colors } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { subscribeToMessages, sendMessage } from '../services/chat';
import { useTranslation } from 'react-i18next';



export default function ChatScreen({ route, navigation }) {
  const { conversationId, otherPhone, otherName, listing } = route.params;
  const { user } = useAuth();
  const { t } = useTranslation();
  const safeSpots = [
    { icon: '☕', name: t('chat.spot1Name'), sub: t('chat.spot1Sub') },
    { icon: '🏬', name: t('chat.spot2Name'), sub: t('chat.spot2Sub') },
    { icon: '🚓', name: t('chat.spot3Name'), sub: t('chat.spot3Sub') },
  ];
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [showSpots, setShowSpots] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(conversationId, setMessages);
    return unsubscribe;
  }, [conversationId]);

  const send = async (content) => {
    const value = (content ?? text).trim();
    if (!value) return;
    setText('');
    const myName = user.displayName || null;
    await sendMessage(conversationId, user.uid, value, myName);
  };

  const basePrice = listing?.price ? parseInt(listing.price) : NaN;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.headerBack}>→</Text></TouchableOpacity>
        <View style={styles.avatar}><Text>👤</Text></View>
        <Text style={styles.headerName}>{otherName || otherPhone || t('chat.defaultUserName')}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isMe = item.senderId === user.uid;
            return (
              <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                {!!item.senderName && (
                  <Text style={[styles.senderLabel, isMe ? styles.senderLabelMe : styles.senderLabelThem]}>
                    {item.senderName}
                  </Text>
                )}
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                  <Text style={isMe ? styles.bubbleTextMe : styles.bubbleTextThem}>{item.text}</Text>
                </View>
              </View>
            );
          }}
        />

        {showSpots && (
          <View style={styles.spotsPanel}>
            <Text style={styles.spotsTitle}>{t('chat.meetingSpotsTitle')}</Text>
            {safeSpots.map((s) => (
              <TouchableOpacity key={s.name} style={styles.spotItem} onPress={() => { send(t('chat.suggestSpotMsg', { name: s.name })); setShowSpots(false); }}>
                <Text style={{ fontSize: 18 }}>{s.icon}</Text>
                <View>
                  <Text style={styles.spotName}>{s.name}</Text>
                  <Text style={styles.spotSub}>{s.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.safeBtn} onPress={() => setShowSpots(!showSpots)}>
            <Text style={styles.safeBtnText}>{t('chat.safeSpotBtn')}</Text>
          </TouchableOpacity>
          {!isNaN(basePrice) && (
            <>
              <TouchableOpacity style={styles.offerChip} onPress={() => send(t('chat.offerMsg', { amount: Math.round(basePrice * 0.9) }))}>
                <Text style={styles.offerChipText}>-10%</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.offerChip} onPress={() => send(t('chat.offerMsg', { amount: Math.round(basePrice * 0.8) }))}>
                <Text style={styles.offerChipText}>-20%</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={t('chat.inputPlaceholder')}
            placeholderTextColor={colors.muted}
            textAlign="right"
            onSubmitEditing={() => send()}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={() => send()}>
            <Text style={{ color: colors.paper }}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tarp },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, padding: 16 },
  headerBack: { color: colors.mustard, fontSize: 18, fontWeight: '700' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.kraft, alignItems: 'center', justifyContent: 'center' },
  headerName: { color: colors.paper, fontWeight: '700', fontSize: 14 },
  senderLabel: { fontSize: 10.5, marginBottom: 2, marginHorizontal: 4 },
  senderLabelMe: { color: colors.mustard },
  senderLabelThem: { color: colors.muted },
  bubble: { maxWidth: '75%', padding: 10, borderRadius: 16 },
  bubbleMe: { backgroundColor: colors.marker, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: colors.kraft, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleTextMe: { color: colors.paper, fontSize: 13 },
  bubbleTextThem: { color: colors.ink, fontSize: 13 },
  quickRow: { flexDirection: 'row-reverse', gap: 8, paddingHorizontal: 14, paddingBottom: 8 },
  safeBtn: { backgroundColor: colors.mustard, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  safeBtnText: { fontSize: 11.5, fontWeight: '700', color: colors.ink },
  offerChip: { backgroundColor: colors.kraft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  offerChipText: { fontSize: 11.5, fontWeight: '700', color: colors.ink },
  spotsPanel: { backgroundColor: colors.paper, margin: 14, borderRadius: 14, padding: 14 },
  spotsTitle: { fontWeight: '900', fontSize: 13, color: colors.ink, textAlign: 'right', marginBottom: 8 },
  spotItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, backgroundColor: '#efe8d8', borderRadius: 12, padding: 10, marginBottom: 6 },
  spotName: { fontWeight: '700', fontSize: 12.5, color: colors.ink, textAlign: 'right' },
  spotSub: { fontSize: 11, color: colors.muted, textAlign: 'right' },
  inputRow: { flexDirection: 'row-reverse', gap: 8, padding: 14, backgroundColor: colors.tarpDark },
  input: { flex: 1, backgroundColor: colors.paper, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, fontSize: 13, color: colors.ink },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.marker, alignItems: 'center', justifyContent: 'center' },
});
