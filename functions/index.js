// Cloud Function: كل مرة كيتزاد رسالة جديدة فمحادثة، كنصيفطو إشعار Push للشخص الآخر
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const vision = require('@google-cloud/vision');
const visionClient = new vision.ImageAnnotatorClient();

initializeApp();
const db = getFirestore();

exports.onNewMessage = onDocumentCreated('conversations/{conversationId}/messages/{messageId}', async (event) => {
  const message = event.data.data();
  const { conversationId } = event.params;
  console.log('New message in', conversationId, 'from', message.senderId);

  const convoSnap = await db.collection('conversations').doc(conversationId).get();
  if (!convoSnap.exists) return;
  const convo = convoSnap.data();

  // كنحددو شكون الطرف الآخر (اللي خاصو يستقبل الإشعار، ماشي اللي صيفط)
  const recipientId = convo.sellerId === message.senderId ? convo.buyerId : convo.sellerId;
  if (!recipientId) { console.log('No recipientId found'); return; }
  console.log('Recipient:', recipientId);

  const userSnap = await db.collection('users').doc(recipientId).get();
  const pushToken = userSnap.exists ? userSnap.data().pushToken : null;
  if (!pushToken) { console.log('No pushToken for recipient', recipientId); return; }
  console.log('Sending push to token:', pushToken);

  const resp = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: pushToken,
      title: `💬 ${convo.listingTitle || 'رسالة جديدة'}`,
      body: message.text,
      sound: 'default',
      data: { conversationId, screen: 'Chat' },
    }),
  });
  const respJson = await resp.json();
  console.log('Expo push response:', JSON.stringify(respJson));
});


// Cloud Function: فحص تلقائي لصور الإعلانات الجديدة (محتوى إباحي/عنيف)
exports.onListingCreated = onDocumentCreated('listings/{listingId}', async (event) => {
  const listing = event.data.data();
  const { listingId } = event.params;

  if (!listing.imageUrl) return;

  try {
    const [result] = await visionClient.safeSearchDetection(listing.imageUrl);
    const detections = result.safeSearchAnnotation;

    const unsafe = ['LIKELY', 'VERY_LIKELY'];
    const isAdult = unsafe.includes(detections.adult);
    const isViolence = unsafe.includes(detections.violence);
    const isRacy = detections.racy === 'VERY_LIKELY';

    console.log('SafeSearch result for', listingId, ':', JSON.stringify(detections));

    if (isAdult || isViolence || isRacy) {
      console.log('Unsafe content detected, deleting listing', listingId);
      await db.collection('listings').doc(listingId).update({ deleted: true, flaggedReason: 'auto_moderation' });

      if (listing.userId) {
        const userRef = db.collection('users').doc(listing.userId);
        const userSnap = await userRef.get();
        const prevViolations = userSnap.exists ? (userSnap.data().violationCount || 0) : 0;
        const newViolations = prevViolations + 1;

        await userRef.set({ violationCount: newViolations }, { merge: true });

        if (newViolations >= 2) {
          console.log('Blocking user after repeated violations:', listing.userId);
          await userRef.set({ isBlocked: true }, { merge: true });
        }
      }
    }
  } catch (error) {
    console.log('Vision API error for listing', listingId, ':', error.message);
  }
});
