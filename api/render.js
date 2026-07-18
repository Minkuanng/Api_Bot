// api/render.js
// Nhận: { "form": "basic" | "advanced", "data": "..." }
// - form=basic    -> data là chuỗi Base64 của HTML (kèm css/js nhúng sẵn bên trong)
// - form=advanced -> data là chuỗi đã mã hóa AES-256-GCM (định dạng iv.tag.ciphertext)
// Giải mã xong -> trả về HTML nguyên vẹn (render trực tiếp hoặc bọc JSON)

import { decodeBasic, decodeAdvanced } from '../lib/crypto.js';
import { parseJsonBody, setCors } from '../lib/body.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  let form, data, format;

  try {
    if (req.method === 'POST') {
      const body = await parseJsonBody(req);
      form = body.form;
      data = body.data;
      format = body.format || req.query.format || 'json';
    } else if (req.method === 'GET') {
      form = req.query.form;
      data = req.query.data;
      format = req.query.format || 'html';
    } else {
      return res.status(405).json({ success: false, error: 'Chỉ hỗ trợ GET hoặc POST.' });
    }
  } catch (err) {
    return res.status(400).json({ success: false, error: 'JSON không hợp lệ: ' + err.message });
  }

  if (!form || !data) {
    return res.status(400).json({
      success: false,
      error: 'Thiếu field "form" hoặc "data".',
      vi_du: { form: 'basic', data: '<base64 cua html>' },
    });
  }

  if (form !== 'basic' && form !== 'advanced') {
    return res.status(400).json({
      success: false,
      error: 'field "form" chỉ nhận giá trị "basic" hoặc "advanced".',
    });
  }

  let html;
  try {
    html = form === 'basic' ? decodeBasic(data) : decodeAdvanced(data);
  } catch (err) {
    return res.status(400).json({ success: false, error: 'Giải mã thất bại: ' + err.message });
  }

  if (format === 'html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  }

  return res.status(200).json({ success: true, form, html });
}
