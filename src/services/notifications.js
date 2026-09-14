import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(uid) {
  if (!Device.isDevice) {
    console.log('الإشعارات كتخدم غير على جهاز حقيقي');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return 'denied';
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D9A441',
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '6c08c313-52d8-4c88-8192-2a2384cbe61c',
    });
    const token = tokenData.data;

    if (uid) {
      await updateDoc(doc(db, 'users', uid), { pushToken: token });
    }

    return token;
  } catch (e) {
    console.log('خطأ فجلب push token:', e);
    return null;
  }
}

export async function disablePushNotifications(uid) {
  if (uid) {
    await updateDoc(doc(db, 'users', uid), { pushToken: null });
  }
}
