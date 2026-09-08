import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { colors } from '../theme/theme';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);

  const sendCode = async () => {
    const cleaned = phone.trim().replace(/\s/g, '');
    if (!cleaned) {
      Alert.alert('خطأ', 'الرجاء إدخال رقم الهاتف');
      return;
    }
    const formatted = cleaned.startsWith('+') ? cleaned : `+212${cleaned.replace(/^0/, '')}`;
    setSending(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber(formatted);
      setSending(false);
      navigation.navigate('Verify', { confirmation, phone: formatted });
    } catch (error) {
      setSending(false);
      Alert.alert('حدث خطأ', 'تعذر إرسال الكود.\n' + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>رجوع &#8594;</Text>
      </TouchableOpacity>
      <View style={styles.form}>
        <Text style={styles.header}>دخول لاحساب / تسجيل دخول</Text>
        <Text style={styles.sub}>دخل رقم هاتفك</Text>
        <Text style={styles.label}>رقم الهاتف</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="06 12 34 56 78"
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
          textAlign="right"
        />
        <TouchableOpacity style={styles.submitBtn} onPress={sendCode} disabled={sending}>
          <Text style={styles.submitText}>{sending ? 'جاري الإرسال...' : 'إرسال الكود'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tarp },
  backRow: { paddingHorizontal: 20, paddingTop: 14 },
  backText: { color: colors.mustard, fontWeight: '700', textAlign: 'right' },
  form: { padding: 20, paddingTop: 10 },
  header: { fontSize: 22, fontWeight: '900', color: colors.paper, textAlign: 'right', marginBottom: 6 },
  sub: { color: colors.paper, fontSize: 13, opacity: 0.75, textAlign: 'right', marginBottom: 20 },
  label: { color: colors.mustard, fontSize: 12.5, fontWeight: '700', textAlign: 'right', marginBottom: 6 },
  input: { backgroundColor: colors.kraft, borderRadius: 12, padding: 13, fontSize: 14, color: colors.ink },
  submitBtn: { backgroundColor: colors.marker, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  submitText: { color: colors.paper, fontWeight: '900', fontSize: 15 },
});
