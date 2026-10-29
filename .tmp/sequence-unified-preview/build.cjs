const fs=require('fs'),path=require('path');
const sharp=require('C:/Users/ACER/AppData/Local/OpenAI/Codex/runtimes/cua_node/1fb7137c46617d50/bin/node_modules/sharp');
const OUT=path.resolve(__dirname,'../../src/Docs'), W=1800, FONT=27, LH=27;
const xs=[100,420,740,1060,1380,1700];
const events=[];
const m=(a,b,t)=>events.push({k:'m',a,b,t});
const r=(a,b,t)=>events.push({k:'r',a,b,t});
const start=(kind,t)=>events.push({k:'start',kind,t});
const otherwise=t=>events.push({k:'else',t});
const end=()=>events.push({k:'end'});
m(0,1,'Chọn thao tác\ngiỏ hàng');
m(1,2,'Gửi yêu cầu\ntương ứng');
m(2,3,'Xử lý thao tác giỏ\n(userId)');
start('opt','Thêm / đổi số lượng');
m(3,3,'Kiểm tra số lượng\ntừ 1 đến 100');
end();
m(3,4,'Đọc dữ liệu cần\ncho thao tác');
m(4,5,'SELECT giỏ hàng /\nbiến thể tương ứng');
m(3,3,'Đúng người dùng;\ncòn bán, đủ tồn kho\n(nếu thêm / sửa)');
start('alt','Xem giỏ hàng');
m(3,3,'Tạo CartDto;\ntính tổng và phí giao');
otherwise('Thêm sản phẩm');
m(3,3,'Thêm mới / cộng dồn\n(tổng số lượng ≤ 100)');
otherwise('Đổi số lượng');
m(3,3,'Thay số lượng\ndòng giỏ hàng');
otherwise('Xóa một dòng');
m(3,3,'Đánh dấu xóa\ndòng giỏ hàng');
otherwise('Xóa toàn bộ');
m(3,3,'Đánh dấu xóa mọi\ndòng của người dùng');
end();
start('opt','Có dữ liệu cần ghi');
m(3,4,'SaveChangesAsync()');
m(4,5,'INSERT / UPDATE /\nDELETE theo thao tác');
end();
start('opt','Sau khi xóa một dòng');
r(3,2,'Đã xóa dòng giỏ');
m(2,3,'GetMyCartAsync\n(userId)');
end();
start('opt','Thêm / sửa / xóa dòng');
m(3,4,'Truy vấn giỏ hàng\nđã cập nhật');
m(4,5,'SELECT giỏ kèm\nthông tin sản phẩm');
m(3,3,'Tạo CartDto mới;\ntính lại tổng và phí');
end();
r(3,2,'CartDto / kết quả\nxóa toàn bộ');
r(2,1,'200 OK;\nthêm mới: 201 Created');
r(1,0,'Hiển thị giỏ /\nthông báo kết quả');

const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function wrap(t,width,font=FONT){const limit=Math.floor(width/(font*.48));let out=[];for(const line of t.split('\n')){let cur='';for(const word of line.split(' ')){if((cur+' '+word).trim().length>limit&&cur){out.push(cur);cur=word}else cur=(cur+' '+word).trim()}if(cur)out.push(cur)}return out;}
let y=205,number=0,stack=[],frames=[],rows=[];
for(const e of events){let lines=[],h=0;if(['m','r'].includes(e.k)){e.n=++number;let width=e.a===e.b?286:Math.abs(xs[e.a]-xs[e.b])-24;lines=wrap(e.n+'. '+e.t,width);h=lines.length*LH+(e.a===e.b?46:17)}else if(e.k==='start'){stack.push({y,kind:e.kind});lines=[e.t];h=38}else if(e.k==='else'){lines=[e.t];h=38}else {let frame=stack.pop();frames.push({...frame,bottom:y});h=9}rows.push({e,y,h,lines,arrow:y+h-9});y+=h+2;}
const BOTTOM=y+18,H=BOTTOM+120;
let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><style>text{font-family:Arial,Helvetica,sans-serif;fill:#111}line,path,rect,circle{fill:none;stroke:#111;stroke-width:1.8}</style><rect width="100%" height="100%" style="fill:white;stroke:none"/><defs><marker id="call" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><path d="M0,0L8,3.5L0,7Z" style="fill:#111"/></marker><marker id="reply" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><path d="M0,0L8,3.5L0,7"/></marker></defs><rect x="15" y="12" width="1770" height="${BOTTOM-12}"/><path d="M15,52h295l17,-17V12"/><text x="29" y="39" font-size="25" font-weight="bold">sd Quản lý giỏ hàng</text>`;
function txt(t,x,y,font=FONT,anchor='middle',bold=false){return `<text x="${x}" y="${y}" font-size="${font}" text-anchor="${anchor}" ${bold?'font-weight="bold"':''}>${esc(t)}</text>`;}
const names=['Khách hàng',': CartForm',': CartController',': CartService',': AppDbContext',': SQL Server'];
for(let i=0;i<6;i++){let x=xs[i];if(i===0)svg+=`<circle cx="${x}" cy="78" r="10"/><path d="M${x},88v31m-18,-18h36m-18,18l-20,24m20,-24l20,24"/>`;else if(i===5)svg+=`<rect x="${x-76}" y="69" width="152" height="52"/>`;else{svg+=`<circle cx="${x}" cy="96" r="22"/>`;if(i===1)svg+=`<path d="M${x-35},69v54m0,-27h13"/>`;else svg+=`<path d="M${x+4},71l-10,6l10,6"/>`;}
svg+=txt(names[i],x,i===5?101:171,i===5?23:25,'middle',true);
svg+=`<line data-lifeline="${i}" x1="${x}" x2="${x}" y1="${i===5?122:188}" y2="${BOTTOM-13}" stroke-dasharray="5 7" style="stroke:#666;stroke-width:1.5"/>`;}
for(const f of frames){svg+=`<rect x="30" y="${f.y}" width="1740" height="${f.bottom-f.y}"/><path d="M30,${f.y+35}h65l15,-15v-20"/>`+txt(f.kind,43,f.y+25,25,'start',true);}
// One continuous dashed lifeline per participant; omit optional long execution bars.
// Self-calls retain short execution rectangles and fully connected return bends.
for(const row of rows){const {e,lines,arrow}=row;if(['m','r'].includes(e.k)){let xa=xs[e.a],xb=xs[e.b],tx=(xa+xb)/2;if(e.a===e.b){tx=xa+160;svg+=`<rect data-activation="self" x="${xa-6}" y="${arrow-26}" width="12" height="36" style="fill:white"/><path data-message="${e.n}" d="M${xa+6},${arrow-24}H${xa+73}V${arrow}H${xa+6}" marker-end="url(#call)"/>`;}else{svg+=`<line data-message="${e.n}" x1="${xa}" x2="${xb}" y1="${arrow}" y2="${arrow}" ${e.k==='r'?'stroke-dasharray="8 6"':''} marker-end="url(#${e.k==='r'?'reply':'call'})"/>`;}
for(let j=0;j<lines.length;j++)svg+=txt(lines[j],tx,row.y+j*LH+FONT-3);}
else if(['start','else'].includes(e.k)){if(e.k==='else')svg+=`<line x1="30" x2="1770" y1="${row.y}" y2="${row.y}" stroke-dasharray="8 6"/>`;svg+=txt('['+e.t+']',128,row.y+28,24,'start');}}
svg+=txt('Hình mẫu. Sơ đồ tuần tự chức năng Quản lý giỏ hàng',W/2,BOTTOM+47,30,'middle',true)+txt('Đã đăng nhập; luồng hợp lệ; mỗi yêu cầu chỉ chọn một thao tác.',W/2,BOTTOM+83,25)+'</svg>';
fs.mkdirSync(OUT,{recursive:true});const stem=path.join(OUT,'MauDuyet_SoDoTuanTu_CartForm');fs.writeFileSync(stem+'.svg',svg);
(async()=>{await sharp(Buffer.from(svg)).png().toFile(stem+'.png');console.log(JSON.stringify({png:stem+'.png',svg:stem+'.svg',width:W,height:H,messages:number,printedHeightAt6in:6*H/W}));})();
