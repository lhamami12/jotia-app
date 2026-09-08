// Cloud Function: كل مرة كيتزاد رسالة جديدة فمحادثة، كنصيفطو إشعار Push للشخص الآخر
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

exports.onNewMessage = onDocumentCreated('conversations/{conversationId}/messages/{messageId}', async (event) => {
  const message = event.data.data();
  const { conversationId } = event.params;

  const convoSnap = await db.collection('conversations').doc(conversationId).get();
  if (!convoSnap.exists) return;
  const convo = convoSnap.data();

  // كنحددو شكون الطرف الآخر (اللي خاصو يستقبل الإشعار، ماشي اللي صيفط)
  const recipientId = convo.sellerId === message.senderId ? convo.buyerId : convo.sellerId;
  if (!recipientId) return;

  const userSnap = await db.collection('users').doc(recipientId).get();
  const expoPushToken = userSnap.exists ? userSnap.data().expoPushToken : null;
  if (!expoPushToken) return; // المستخدم ماعندوش جهاز مسجل، أو رفض الإذن

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: expoPushToken,
      title: `💬 ${convo.listingTitle || 'رسالة جديدة'}`,
      body: message.text,
      sound: 'default',
      data: { conversationId, screen: 'Chat' },
    }),
  });
});
