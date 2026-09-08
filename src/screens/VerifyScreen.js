import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { colors } from '../theme/theme';

export default function VerifyScreen({ route, navigation }) {
  const { confirmation, phone } = route.params;
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);

  const confirmCode = async () => {
    if (!code.trim()) {
      Alert.alert('خاصك الكود', 'دخل الكود اللي وصلك بالـ SMS');
      return;
    }
    setChecking(true);
    try {
      await confirmation.confirm(code.trim());
      // onAuthStateChanged فـ AuthContext غادي يتكلف تلقائياً بتحديث حالة الدخول
      setChecking(false);
      navigation.navigate('MainTabs');
    } catch (error) {
      setChecking(false);
      Alert.alert('الكود غير صحيح', 'تأكد من الكود وحاول مرة أخرى.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.header}>أدخل كود التأكيد</Text>
        <Text style={styles.sub}>صيفطنا كود ديال 6 أرقام لـ {phone}</Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="• • • • • •"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          textAlign="center"
          maxLength={6}
        />
        <TouchableOpacity style={styles.submitBtn} onPress={confirmCode} disabled={checking}>
          <Text style={styles.submitText}>{checking ? 'كنتأكدو...' : 'تأكيد ✓'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tarp },
  form: { padding: 20, paddingTop: 60 },
  header: { fontSize: 22, fontWeight: '900', color: colors.paper, textAlign: 'right', marginBottom: 6 },
  sub: { color: colors.paper, fontSize: 13, opacity: 0.75, textAlign: 'right', marginBottom: 20 },
  input: { backgroundColor: colors.kraft, borderRadius: 12, padding: 13, fontSize: 20, letterSpacing: 10, color: colors.ink, marginBottom: 10 },
  submitBtn: { backgroundColor: colors.marker, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  submitText: { color: colors.paper, fontWeight: '900', fontSize: 15 },
});
