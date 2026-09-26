import React, { useState } from 'react';
import { Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, View } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function DeleteAccountButton() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const doDelete = async () => {
    const user = auth().currentUser;
    if (!user) return;
    setBusy(true);
    try {
      await firestore().collection('deletionRequests').doc(user.uid).set({
        uid: user.uid,
        requestedAt: firestore.FieldValue.serverTimestamp(),
      });
      await auth().signOut();
      Alert.alert(t('deleteAccount.doneTitle'), t('deleteAccount.doneMsg'));
    } catch (e) {
      console.log('Delete account error:', e);
      setBusy(false);
      Alert.alert(t('deleteAccount.errorTitle'), t('deleteAccount.errorMsg'));
    }
  };

  const askConfirm = () =>
    Alert.alert(t('deleteAccount.confirmTitle'), t('deleteAccount.confirmMsg'), [
      { text: t('deleteAccount.cancel'), style: 'cancel' },
      { text: t('deleteAccount.confirm'), style: 'destructive', onPress: doDelete },
    ]);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.btn} onPress={askConfirm} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{t('deleteAccount.button')}</Text>}
      </TouchableOpacity>
      <Text style={styles.hint}>{t('deleteAccount.hint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 32, marginBottom: 24 },
  btn: { borderWidth: 1.5, borderColor: '#c0392b', borderRadius: 14, padding: 14, alignItems: 'center' },
  text: { color: '#e74c3c', fontWeight: '800', fontSize: 15 },
  hint: { color: '#f5efe3', opacity: 0.55, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
