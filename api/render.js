// api/render.js
// Vercel Serverless Function - Node.js
// Nhận HTML + CSS + JS -> ghép thành 1 trang HTML hoàn chỉnh -> trả về ngay
// Không lưu trữ, không cần auth (public)

export default function handler(req, res) {
  // Cho phép gọi từ bất kỳ domain nào (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Trình duyệt/thư viện hay gửi OPTIONS trước khi POST thật -> trả 200 luôn
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let html = '';
  let css = '';
  let js = '';
  let format = 'html'; // 'html' = trả về trang render sẵn, 'json' = trả về dạng JSON

  if (req.method === 'POST') {
    // Body dạng JSON: { "html": "...", "css": "...", "js": "..." }
    const body = req.body || {};
    html = body.html || '';
    css = body.css || '';
    js = body.js || '';
    format = body.format || req.query.format || 'html';
  } else if (req.method === 'GET') {
    // Dùng query string để test nhanh trên trình duyệt:
    // /api/render?html=...&css=...&js=...
    html = req.query.html || '';
    css = req.query.css || '';
    js = req.query.js || '';
    format = req.query.format || 'html';
  } else {
    return res.status(405).json({
      success: false,
      error: 'Method không được hỗ trợ. Chỉ dùng GET hoặc POST.',
    });
  }

  const combined = buildHtmlDocument(html, css, js);

  // Nếu muốn nhận JSON (ví dụ để hiển thị trong app riêng) thì thêm ?format=json
  if (format === 'json') {
    return res.status(200).json({
      success: true,
      combinedHtml: combined,
      html,
      css,
      js,
    });
  }

  // Mặc định: trả thẳng về 1 trang HTML hoàn chỉnh, mở link là thấy kết quả render
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(combined);
}

function buildHtmlDocument(html, css, js) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rendered Page</title>
<style>
${css}
</style>
</head>
<body>
${html}
<script>
${js}
</script>
</body>
</html>`;
}
