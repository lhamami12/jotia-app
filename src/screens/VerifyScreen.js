import { dir } from '../i18n';
import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { colors } from '../theme/theme';
import { useTranslation } from 'react-i18next';

export default function VerifyScreen({ route, navigation }) {
  const { confirmation, phone } = route.params;
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const done = useRef(false);
  const { t } = useTranslation();

  const goHome = () => {
    if (done.current) return;
    done.current = true;
    setChecking(false);
    navigation.navigate('MainTabs');
  };

  // Android peut lire le SMS et connecter l'utilisateur automatiquement
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      if (user) goHome();
    });
    return unsubscribe;
  }, []);

  const confirmCode = async () => {
    if (auth().currentUser) { goHome(); return; }
    if (!code.trim()) {
      Alert.alert(t('verify.alertTitle'), t('verify.alertMsg'));
      return;
    }
    setChecking(true);
    try {
      await confirmation.confirm(code.trim());
      goHome();
    } catch (error) {
      // Déjà connecté automatiquement : ce n'est pas une vraie erreur
      if (auth().currentUser) { goHome(); return; }
      setChecking(false);
      const c = error?.code || '';
      if (c === 'auth/too-many-requests') {
        Alert.alert(t('verify.errorTitle'), t('login.tooManyRequests'));
      } else if (c === 'auth/session-expired' || c === 'auth/code-expired') {
        Alert.alert(t('verify.errorTitle'), t('verify.expiredMsg'));
      } else {
        Alert.alert(t('verify.errorTitle'), t('verify.errorMsg'));
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.header}>{t('verify.header')}</Text>
        <Text style={styles.sub}>{t('verify.sub', { phone })}</Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="• • • • • •"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          textAlign="center"
          maxLength={6}
          autoComplete="sms-otp"
          textContentType="oneTimeCode"
        />
        <TouchableOpacity style={styles.submitBtn} onPress={confirmCode} disabled={checking}>
          <Text style={styles.submitText}>{checking ? t('verify.checking') : t('verify.confirm')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tarp },
  form: { padding: 20, paddingTop: 60 },
  header: { fontSize: 22, fontWeight: '900', color: colors.paper, textAlign: dir.align, marginBottom: 6 },
  sub: { color: colors.paper, fontSize: 13, opacity: 0.75, textAlign: dir.align, marginBottom: 20 },
  input: { backgroundColor: colors.kraft, borderRadius: 12, padding: 13, fontSize: 20, letterSpacing: 10, color: colors.ink, marginBottom: 10 },
  submitBtn: { backgroundColor: colors.marker, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  submitText: { color: colors.paper, fontWeight: '900', fontSize: 15 },
});
