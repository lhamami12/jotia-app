// Chat functions: conversations and messages
import firestore from '@react-native-firebase/firestore';
import { db } from './firebase';

// Fixed conversation id: same listing + same buyer = always the same conversation (never duplicated)
function buildConversationId(listingId, buyerId) {
  return `${listingId}_${buyerId}`;
}

// Get the conversation if it exists, otherwise create a new one
export async function getOrCreateConversation({ listingId, listingTitle, listingEmoji, sellerId, sellerPhone, sellerName, buyerId, buyerPhone, buyerName }) {
  const conversationId = buildConversationId(listingId, buyerId);
  const ref = db.collection('conversations').doc(conversationId);
  const snap = await ref.get();

  if (!snap.exists()) {
    await ref.set({
      listingId, listingTitle, listingEmoji,
      sellerId, sellerPhone, sellerName: sellerName || null,
      buyerId, buyerPhone, buyerName: buyerName || null,
      participants: [sellerId, buyerId],
      lastMessage: '',
      lastMessageAt: firestore.FieldValue.serverTimestamp(),
      unreadCounts: { [sellerId]: 0, [buyerId]: 0 },
      deletedBy: [],
    });
  }
  return conversationId;
}

// Live listener for messages in a given conversation
export function subscribeToMessages(conversationId, callback) {
  const messagesRef = db.collection('conversations').doc(conversationId).collection('messages');
  return messagesRef.orderBy('createdAt', 'asc').onSnapshot(
    (snapshot) => {
      if (!snapshot) return;
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (error) => {
      console.log('Error fetching messages:', error.message);
    }
  );
}

// Send a message (plain text, or a price offer 💰, or a meeting point 🛡️)
export async function sendMessage(conversationId, senderId, text, senderName) {
  const messagesRef = db.collection('conversations').doc(conversationId).collection('messages');
  await messagesRef.add({ senderId, text, senderName: senderName || null, createdAt: firestore.FieldValue.serverTimestamp() });

  const convoRef = db.collection('conversations').doc(conversationId);
  const convoSnap = await convoRef.get();
  const recipientId = convoSnap.exists()
    ? (convoSnap.data().sellerId === senderId ? convoSnap.data().buyerId : convoSnap.data().sellerId)
    : null;

  const updates = {
    lastMessage: text,
    lastMessageAt: firestore.FieldValue.serverTimestamp(),
    deletedBy: [],
  };
  if (recipientId) {
    updates[`unreadCounts.${recipientId}`] = firestore.FieldValue.increment(1);
  }
  await convoRef.update(updates);
}

// Reset a user's unread message counter for a conversation (called when opening the chat)
export async function markConversationAsRead(conversationId, userId) {
  await db.collection('conversations').doc(conversationId).update({
    [`unreadCounts.${userId}`]: 0,
  });
}

// Delete a conversation for one user only (the other side still sees it)
export async function deleteConversationForUser(conversationId, userId) {
  await db.collection('conversations').doc(conversationId).update({
    deletedBy: firestore.FieldValue.arrayUnion(userId),
  });
}

// All conversations for a given user (to fill the "Messages" tab)
export function subscribeToMyConversations(userId, callback) {
  let all = [];
  let blocked = [];
  const emit = () => callback(all.filter((c) =>
    !(c.deletedBy || []).includes(userId) &&
    !(c.participants || []).some((p) => p !== userId && blocked.includes(p))));
  const unsubUser = db.collection('users').doc(userId).onSnapshot((snap) => {
    blocked = (snap && snap.exists() && snap.data().blockedUsers) || [];
    emit();
  }, () => {});
  const q = db.collection('conversations').where('participants', 'array-contains', userId).orderBy('lastMessageAt', 'desc');
  const unsubConvos = q.onSnapshot((snapshot) => {
    if (!snapshot) return;
    all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    emit();
  }, (error) => {
    console.log('Error fetching conversations:', error.message);
    callback([]);
  });
  return () => { unsubUser(); unsubConvos(); };
}
