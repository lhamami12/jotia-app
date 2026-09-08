// إعدادات الرفع عبر Cloudinary (unsigned upload)
const CLOUDINARY_CLOUD_NAME = 'gdlpyhvi';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

// دالة لرفع صورة واحدة (من خلال URI محلية) وإرجاع رابط التحميل النهائي
export async function uploadListingImage(localUri, userId) {
  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    type: 'image/jpeg',
    name: `${userId}_${Date.now()}_${Math.floor(Math.random() * 10000)}.jpg`,
  });
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );

  const data = await response.json();
  if (!data.secure_url) {
    throw new Error('فشل رفع الصورة: ' + (data.error?.message || JSON.stringify(data)));
  }
  return data.secure_url;
}

// دالة لرفع عدة صور دفعة واحدة، ترجع array ديال الروابط بنفس ترتيب الإدخال
export async function uploadListingImages(localUris, userId) {
  const urls = [];
  for (const uri of localUris) {
    const url = await uploadListingImage(uri, userId);
    urls.push(url);
  }
  return urls;
}
