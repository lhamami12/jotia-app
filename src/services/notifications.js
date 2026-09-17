import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
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
    console.log('Push notifications only work on a real device');
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
      await db.collection('users').doc(uid).update({ pushToken: token });
    }

    return token;
  } catch (e) {
    console.log('Error getting push token:', e);
    return null;
  }
}

export async function disablePushNotifications(uid) {
  if (uid) {
    await db.collection('users').doc(uid).update({ pushToken: null });
  }
}
