// كل الدوال ديال الشات: المحادثات والرسائل
import {
  collection, doc, setDoc, getDoc, addDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Alert } from 'react-native';
// معرّف ثابت للمحادثة: نفس الإعلان + نفس المشتري = نفس المحادثة ديما (ماكيتكررش)
function buildConversationId(listingId, buyerId) {
  return `${listingId}_${buyerId}`;
}

// كنجيبو المحادثة إيلا كاينة، وإلا كنخلقو وحدة جديدة
export async function getOrCreateConversation({ listingId, listingTitle, listingEmoji, sellerId, sellerPhone, sellerName, buyerId, buyerPhone, buyerName }) {
  const conversationId = buildConversationId(listingId, buyerId);
  const ref = doc(db, 'conversations', conversationId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      listingId, listingTitle, listingEmoji,
      sellerId, sellerPhone, sellerName: sellerName || null,
      buyerId, buyerPhone, buyerName: buyerName || null,
      participants: [sellerId, buyerId],
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
    });
  }
  return conversationId;
}

// كنتنصتو على الرسائل ديال محادثة معينة فالوقت الحقيقي
export function subscribeToMessages(conversationId, callback) {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// صيفط رسالة (نص عادي أو عرض ثمن 💰 أو نقطة لقاء 🛡️)
export async function sendMessage(conversationId, senderId, text, senderName) {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  await addDoc(messagesRef, { senderId, text, senderName: senderName || null, createdAt: serverTimestamp() });
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
  });
}

// كل المحادثات ديال مستخدم معين (باش نعمرو تبويب "الرسائل")
export function subscribeToMyConversations(userId, callback) {
  const q = query(collection(db, 'conversations'), where('participants', 'array-contains', userId), orderBy('lastMessageAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (error) => {
    console.log('خطأ فجلب المحادثات:', error.message);
    callback([]);
  });
}
