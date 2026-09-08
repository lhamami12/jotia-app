import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { colors } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { subscribeToMessages, sendMessage } from '../services/chat';

const safeSpots = [
  { icon: '☕', name: 'قهوة قريبة من الجوطية', sub: 'مكان عمومي مزيان، فيه ناس بزاف' },
  { icon: '🏬', name: 'مدخل المول الكبير', sub: 'مراقب بالكاميرات، بلاصة معروفة' },
  { icon: '🚓', name: 'قدام المفوضية', sub: 'أضمن بلاصة لتبادل السلع الغالية' },
];

export default function ChatScreen({ route, navigation }) {
  const { conversationId, otherPhone, listing } = route.params;
  const { user } = useAuth();
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
    await sendMessage(conversationId, user.uid, value);
  };

  const basePrice = listing?.price ? parseInt(listing.price) : NaN;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.headerBack}>→</Text></TouchableOpacity>
        <View style={styles.avatar}><Text>👤</Text></View>
        <Text style={styles.headerName}>{otherPhone || 'المستخدم'}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.senderId === user.uid ? styles.bubbleMe : styles.bubbleThem]}>
              <Text style={item.senderId === user.uid ? styles.bubbleTextMe : styles.bubbleTextThem}>{item.text}</Text>
            </View>
          )}
        />

        {showSpots && (
          <View style={styles.spotsPanel}>
            <Text style={styles.spotsTitle}>🛡️ اختر نقطة لقاء آمنة</Text>
            {safeSpots.map((s) => (
              <TouchableOpacity key={s.name} style={styles.spotItem} onPress={() => { send(`🛡️ اقترحت نلتقاو فـ: ${s.name}`); setShowSpots(false); }}>
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
            <Text style={styles.safeBtnText}>🛡️ نقطة اللقاء</Text>
          </TouchableOpacity>
          {!isNaN(basePrice) && (
            <>
              <TouchableOpacity style={styles.offerChip} onPress={() => send(`💰 عرضت ${Math.round(basePrice * 0.9)} DH`)}>
                <Text style={styles.offerChipText}>-10%</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.offerChip} onPress={() => send(`💰 عرضت ${Math.round(basePrice * 0.8)} DH`)}>
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
            placeholder="اكتب رسالتك..."
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
