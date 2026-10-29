const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/ACER/AppData/Local/OpenAI/Codex/runtimes/cua_node/1fb7137c46617d50/bin/node_modules/sharp');

const W = 1680, H = 1450;
const out = path.resolve(__dirname, '../../src/Docs');
const stem = path.join(out, 'SoDo_UseCase_TongQuat_CapNhat');
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const guest = [
  [110, 'Đăng ký tài khoản'],
  [194, 'Xem trang chủ'],
  [278, 'Tìm kiếm & lọc sản phẩm'],
  [362, 'Xem chi tiết sản phẩm'],
  [446, 'Khôi phục mật khẩu'],
  [530, 'Tư vấn mua sắm qua chatbot AI', ['Tư vấn mua sắm', 'qua chatbot AI']],
];
const customer = [
  [650, 'Quản lý giỏ hàng'],
  [730, 'Đặt hàng'],
  [810, 'Thanh toán đơn hàng'],
  [890, 'Quản lý đơn hàng của tôi'],
  [1060, 'Quản lý hồ sơ cá nhân'],
  [1140, 'Quản lý sổ địa chỉ'],
  [1220, 'Quản lý danh sách yêu thích'],
  [1300, 'Quản lý đánh giá sản phẩm'],
  [1380, 'Xem mã giảm giá của tôi'],
];
const admin = [
  [570, 'Xem thống kê tổng quan'],
  [650, 'Quản lý sản phẩm'],
  [730, 'Quản lý thuộc tính sản phẩm'],
  [810, 'Quản lý nhà cung cấp'],
  [890, 'Quản lý phiếu nhập hàng'],
  [1060, 'Quản lý đơn hàng'],
  [1140, 'Quản lý mã giảm giá'],
  [1220, 'Quản lý người dùng'],
  [1300, 'Quản lý đánh giá'],
];
const shared = [[940, 'Đăng nhập'], [1000, 'Đăng xuất']];
const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
  '<title>Sơ đồ use-case tổng quát hệ thống website bán quần áo</title>',
  '<desc>Khách hàng kế thừa Khách vãng lai. Bổ sung Tư vấn mua sắm qua chatbot AI cho Khách vãng lai; nhóm các phương thức trong Thanh toán đơn hàng.</desc>',
  '<style>text{font-family:"Times New Roman",serif;fill:#000} .edge{fill:none;stroke:#000;stroke-width:1.65;stroke-linejoin:round;stroke-linecap:round} .node{fill:#fff;stroke:#000;stroke-width:1.65}</style>',
  `<rect width="${W}" height="${H}" fill="#fff"/>`,
  '<rect class="edge" x="275" y="14" width="1240" height="1420" rx="25"/>',
  '<text x="895" y="60" font-size="29" font-weight="bold" text-anchor="middle">HỆ THỐNG WEBSITE BÁN QUẦN ÁO</text>'];

function line(x1, y1, x2, y2) {
  parts.push(`<path class="edge" d="M${x1},${y1}L${x2},${y2}"/>`);
}
function actor(x, cy, label) {
  parts.push(`<circle class="node" cx="${x}" cy="${cy}" r="13"/>`,
    `<path class="edge" d="M${x},${cy+13}V${cy+57}M${x-25},${cy+35}H${x+25}M${x},${cy+57}L${x-24},${cy+90}M${x},${cy+57}L${x+24},${cy+90}"/>`,
    `<text x="${x}" y="${cy+124}" font-size="27" font-weight="bold" text-anchor="middle">${esc(label)}</text>`);
}
async function oval(x, y, rx, label, lines = [label], bold = false) {
  let font = 27;
  for (const text of lines) {
    const meta = await sharp({text:{text:esc(text),font:'Times New Roman 27',dpi:72}}).metadata();
    font = Math.min(font, 27 * (rx * 1.82) / meta.width);
  }
  font = Math.floor(font * 10) / 10;
  const ry = lines.length > 1 ? 37 : 31;
  parts.push(`<g data-use-case="${esc(label)}"><ellipse class="node" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`,
    `<text x="${x}" y="${y}" font-size="${font}"${bold ? ' font-weight="bold"' : ''} text-anchor="middle">`);
  for (let i=0; i<lines.length; i++) {
    parts.push(`<tspan x="${x}" y="${y+(i-(lines.length-1)/2)*29+9}">${esc(lines[i])}</tspan>`);
  }
  parts.push('</text></g>');
}

(async () => {
  // Branch beyond the actor labels so associations do not cross their text.
  line(135, 265, 220, 265);
  line(135, 935, 220, 935);
  line(1575, 935, 1500, 935);
  for (const [y] of guest) line(220, 265, 302, y);
  for (const [y] of customer) line(220, 935, 302, y);
  for (const [y] of admin) line(1500, 935, 1480, y);
  for (const [y] of shared) { line(220, 935, 770, y); line(1500, 935, 1070, y); }
  // UML generalization: the hollow triangle points to the parent actor.
  parts.push('<path class="edge" d="M85,935H24V265H58"/><path class="node" d="M58,253L80,265L58,277Z"/>');
  for (const [y,label,lines] of guest) await oval(510,y,208,label,lines);
  for (const [y,label] of customer) await oval(510,y,208,label);
  for (const [y,label] of admin) await oval(1285,y,195,label);
  for (const [y,label] of shared) await oval(920,y,150,label,[label],true);
  actor(110,230,'Khách vãng lai');
  actor(110,900,'Khách hàng');
  actor(1600,900,'Quản trị viên');
  parts.push('</svg>');
  const svg = parts.join('\n');
  fs.writeFileSync(stem+'.svg',svg,'utf8');
  await sharp(Buffer.from(svg),{density:144}).flatten({background:'#fff'}).withMetadata({density:300}).png().toFile(stem+'.png');
  const preview = path.join(__dirname, 'updated-preview.png');
  await sharp(stem+'.png').resize({width:1344}).png().toFile(preview);
  console.log(JSON.stringify({png:stem+'.png',svg:stem+'.svg',preview,useCases:guest.length+customer.length+admin.length+shared.length,metadata:await sharp(stem+'.png').metadata()}));
})().catch(error => {console.error(error);process.exit(1)});
