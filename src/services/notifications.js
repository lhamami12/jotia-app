// تسجيل الجهاز باش يقدر يستقبل إشعارات Push
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// كنخليو الإشعار يبان حتى والتطبيق مفتوح (مهم للشات)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(userId) {
  if (!Device.isDevice) {
    console.log('الإشعارات ماخدامةش فالمحاكي (Simulator)، خاصها جهاز حقيقي');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('المستخدم رفض الإذن ديال الإشعارات');
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  // كنخزنو التوكن فوثيقة المستخدم باش الـ Cloud Function تقدر تلقاه وتصيفط ليه
  if (userId) {
    await setDoc(doc(db, 'users', userId), { expoPushToken: token }, { merge: true });
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return token;
}
