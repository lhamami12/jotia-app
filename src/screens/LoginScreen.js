import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { colors } from '../theme/theme';

GoogleSignin.configure({
  webClientId: '150628485816-jjcuk3b8a22s1trm3tottrmaadl5eme6.apps.googleusercontent.com',
});

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken || response.idToken;
      if (!idToken) throw new Error(t('login.googleTokenError'));
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);
      navigation.navigate('MainTabs');
    } catch (error) {
      if (error.code !== 'SIGN_IN_CANCELLED' && error.code !== '12501') {
        Alert.alert(t('login.errorTitle'), t('login.googleSignInError') + '\n' + error.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const sendCode = async () => {
    const cleaned = phone.trim().replace(/\s/g, '');
    if (!cleaned) {
      Alert.alert(t('login.phoneRequiredTitle'), t('login.phoneRequiredMessage'));
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
      Alert.alert(t('login.errorTitle'), t('login.sendCodeError') + '\n' + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>{t('login.back')}</Text>
      </TouchableOpacity>
      <View style={styles.form}>
        <Text style={styles.header}>{t('login.header')}</Text>
        <Text style={styles.sub}>{t('login.sub')}</Text>
        <Text style={styles.label}>{t('login.phoneLabel')}</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder={t('login.phonePlaceholder')}
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
          textAlign="right"
        />
        <TouchableOpacity style={styles.submitBtn} onPress={sendCode} disabled={sending}>
          <Text style={styles.submitText}>{sending ? t('login.sending') : t('login.sendCode')}</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('login.or')}</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.googleBtn} onPress={signInWithGoogle} disabled={googleLoading}>
          <Text style={styles.googleBtnText}>{googleLoading ? t('login.googleLoggingIn') : `G  ${t('login.googleLogin')}`}</Text>
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
  dividerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(247,243,232,.2)' },
  dividerText: { color: colors.paper, opacity: 0.6, fontSize: 12 },
  googleBtn: { backgroundColor: colors.kraft, padding: 16, borderRadius: 14, alignItems: 'center' },
  googleBtnText: { color: colors.ink, fontWeight: '900', fontSize: 15 },
});
