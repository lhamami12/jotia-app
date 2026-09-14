const fs = require('fs');
const path = './src/screens/ListingDetailScreen.js';
let content = fs.readFileSync(path, 'utf-8');

// 1. زيادة import
const importTarget = "import { getOrCreateConversation } from '../services/chat';";
const importReplacement = "import { getOrCreateConversation } from '../services/chat';\nimport { getUserProfile } from '../services/users';";

// 2. تعديل openChat باش يجيب الأسماء ويصيفطهم
const funcTarget = `  const openChat = async () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    if (listing.userId === user.uid) return;
    setConnecting(true);
    try {
      const conversationId = await getOrCreateConversation({
        listingId: listing.id,
        listingTitle: listing.title,
        listingEmoji: listing.emoji,
        sellerId: listing.userId,
        sellerPhone: listing.userPhone,
        buyerId: user.uid,
        buyerPhone: user.phoneNumber,
      });
      setConnecting(false);
      navigation.navigate('Chat', { conversationId, otherPhone: listing.userPhone, listing });
    } catch (e) {
      setConnecting(false);
      Alert.alert('خطأ', 'ماقدرناش نبداو المحادثة.\\n' + e.message);
    }
  };`;

const funcReplacement = `  const openChat = async () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    if (listing.userId === user.uid) return;
    setConnecting(true);
    try {
      const [sellerProfile, buyerProfile] = await Promise.all([
        getUserProfile(listing.userId),
        getUserProfile(user.uid),
      ]);
      const sellerName = sellerProfile?.displayName || null;
      const buyerName = buyerProfile?.displayName || user.displayName || null;
      const conversationId = await getOrCreateConversation({
        listingId: listing.id,
        listingTitle: listing.title,
        listingEmoji: listing.emoji,
        sellerId: listing.userId,
        sellerPhone: listing.userPhone,
        sellerName,
        buyerId: user.uid,
        buyerPhone: user.phoneNumber,
        buyerName,
      });
      setConnecting(false);
      navigation.navigate('Chat', { conversationId, otherPhone: listing.userPhone, otherName: sellerName, listing });
    } catch (e) {
      setConnecting(false);
      Alert.alert('خطأ', 'ماقدرناش نبداو المحادثة.\\n' + e.message);
    }
  };`;

let ok = true;
if (content.includes(importTarget)) {
  content = content.replace(importTarget, importReplacement);
} else {
  console.log('NOT FOUND: import target');
  ok = false;
}

if (content.includes(funcTarget)) {
  content = content.replace(funcTarget, funcReplacement);
} else {
  console.log('NOT FOUND: function target');
  ok = false;
}

if (ok) {
  fs.writeFileSync(path, content, 'utf-8');
  console.log('DONE');
} else {
  console.log('PARTIAL - check manually');
}
