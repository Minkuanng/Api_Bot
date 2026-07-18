// api/encode.js
// Nhận: { "form": "basic" | "advanced", "data": "<html thô cần mã hóa>" }
// Trả về: { form, data: "<chuỗi đã mã hóa>" }
// Dùng để test nhanh, hoặc để hệ thống khác gọi trước khi gửi lên /api/render

import { encodeBasic, encodeAdvanced } from '../lib/crypto.js';
import { parseJsonBody, setCors } from '../lib/body.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  let form, data;

  try {
    if (req.method === 'POST') {
      const body = await parseJsonBody(req);
      form = body.form;
      data = body.data;
    } else if (req.method === 'GET') {
      form = req.query.form;
      data = req.query.data;
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
      vi_du: { form: 'basic', data: '<h1>Xin chao</h1>' },
    });
  }

  if (form !== 'basic' && form !== 'advanced') {
    return res.status(400).json({
      success: false,
      error: 'field "form" chỉ nhận giá trị "basic" hoặc "advanced".',
    });
  }

  let encoded;
  try {
    encoded = form === 'basic' ? encodeBasic(data) : encodeAdvanced(data);
  } catch (err) {
    return res.status(400).json({ success: false, error: 'Mã hóa thất bại: ' + err.message });
  }

  return res.status(200).json({ success: true, form, data: encoded });
}
