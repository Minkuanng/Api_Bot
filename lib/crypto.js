// lib/crypto.js
// basic  = Base64 (mã hóa nhẹ, ai cũng decode được, không cần key)
// advanced = AES-256-GCM (mã hóa thật, cần secret key mới giải được, chuỗi dài hơn)

import crypto from 'crypto';

const ALGO = 'aes-256-gcm';

export function encodeBasic(text) {
  return Buffer.from(text, 'utf8').toString('base64');
}

export function decodeBasic(data) {
  return Buffer.from(data, 'base64').toString('utf8');
}

export function encodeAdvanced(text) {
  const key = getKey();
  const iv = crypto.randomBytes(12); // 12 byte theo chuẩn khuyến nghị cho GCM
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Gói lại thành 1 chuỗi: iv.authTag.ciphertext (mỗi phần base64)
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join('.');
}

export function decodeAdvanced(data) {
  const key = getKey();
  const parts = String(data).split('.');
  if (parts.length !== 3) {
    throw new Error('Dữ liệu advanced sai định dạng (cần 3 phần iv.tag.data)');
  }
  const [ivB64, tagB64, cipherB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const cipherText = Buffer.from(cipherB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
  return decrypted.toString('utf8');
}

function getKey() {
  const keyB64 = process.env.ENCRYPTION_KEY;
  if (!keyB64) {
    throw new Error(
      'Chưa cấu hình biến môi trường ENCRYPTION_KEY trên Vercel (xem README để tạo key).'
    );
  }
  const key = Buffer.from(keyB64, 'base64');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY không hợp lệ: phải là base64 của đúng 32 byte.');
  }
  return key;
}
