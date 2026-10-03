import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import * as Application from 'expo-application';
import { useTranslation } from 'react-i18next';
import { db } from '../services/firebase';

const STORE_APP = 'market://details?id=com.jotia.app';
const STORE_WEB = 'https://play.google.com/store/apps/details?id=com.jotia.app';

export default function UpdateGate({ children }) {
  const { t } = useTranslation();
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const current = parseInt(Application.nativeBuildVersion || '0', 10);
        if (!current) return;
        const snap = await db.collection('config').doc('app').get();
        const min = snap.exists() ? Number(snap.data().minVersionCode || 0) : 0;
        if (alive && current < min) setBlocked(true);
      } catch (e) {
        console.log('UpdateGate error:', e?.message);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (!blocked) return children;

  const openStore = () => Linking.openURL(STORE_APP).catch(() => Linking.openURL(STORE_WEB));

  return (
    <View style={{ flex: 1, backgroundColor: '#1F3A47', justifyContent: 'center', padding: 32 }}>
      <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>🔄</Text>
      <Text style={{ color: '#F5EFE3', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 12 }}>
        {t('update.title')}
      </Text>
      <Text style={{ color: '#E8DCC4', fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 24 }}>
        {t('update.message')}
      </Text>
      <TouchableOpacity onPress={openStore} style={{ backgroundColor: '#D9A441', paddingVertical: 16, borderRadius: 16 }}>
        <Text style={{ color: '#1F3A47', fontSize: 18, fontWeight: '800', textAlign: 'center' }}>
          {t('update.button')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
