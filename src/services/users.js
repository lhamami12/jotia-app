// دوال التعامل مع بروفايل المستخدم (الاسم المعروض)
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// تحديث أو تسجيل الاسم المعروض ديال المستخدم
export async function updateUserDisplayName(userId, displayName) {
  await setDoc(doc(db, 'users', userId), { displayName: displayName.trim() }, { merge: true });
}

// جلب بروفايل مستخدم معين (مرة واحدة، ماشي استماع حي)
export async function getUserProfile(userId) {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? snap.data() : null;
}

// توقيف / إلغاء توقيف حساب مستخدم (يستعملها الأدمين فقط)
export async function setUserBlocked(userId, blocked) {
  await setDoc(doc(db, 'users', userId), { isBlocked: blocked }, { merge: true });
}
