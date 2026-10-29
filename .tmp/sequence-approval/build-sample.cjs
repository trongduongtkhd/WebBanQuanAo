const fs=require('fs'),path=require('path');
const sharp=require('C:/Users/ACER/AppData/Local/OpenAI/Codex/runtimes/cua_node/1fb7137c46617d50/bin/node_modules/sharp');
const OUT=path.resolve(__dirname,'../../src/Docs');
const W=1920, xs=[110,445,795,1145,1495,1810],FS=29,LH=35;
const events=[
 [0,1,'Nhập từ khóa và tìm kiếm','call'],
 [1,2,'GET /api/products\n(keyword, page, pageSize)','call'],
 [2,3,'GetProductsAsync\n(query)','call'],
 [3,3,'Chuẩn hóa trang;\nlọc từ khóa, IsActive;\nsắp xếp theo CreatedAt','self'],
 [3,4,'CountAsync()\ntrên truy vấn sản phẩm','call'],
 [4,5,'Đếm sản phẩm\nthỏa điều kiện','call'],
 [5,4,'Tổng số sản phẩm','return'],
 [4,3,'totalItems','return'],
 [3,4,'ToListAsync()\n(sau Skip và Take)','call'],
 [4,5,'Lấy trang sản phẩm;\nkèm danh mục, hãng, ảnh','call'],
 [5,4,'Các bản ghi kết quả','return'],
 [4,3,'productList','return'],
 [3,3,'Ánh xạ Product sang DTO;\ntính TotalPages;\ntạo PagedResult','self'],
 [3,2,'PagedResult<...>\n(dữ liệu và phân trang)','return'],
 [2,1,'200 OK + ApiResponse','return'],
 [1,0,'Hiển thị danh sách\nhoặc không có kết quả','return']
];
const xml=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function wrap(t,width,font=FS){let rows=[];for(let line of t.split('\n')){let curr='';for(let word of line.split(' ')){let next=(curr+' '+word).trim();if(next.length*font*.50>width&&curr){rows.push(curr);curr=word;}else curr=next;}rows.push(curr);}return rows;}
function txt(t,x,y,font=FS,width=350,bold=false){return wrap(t,width,font).map((s,i)=>`<text x="${x}" y="${y+i*(font+6)}" text-anchor="middle" font-size="${font}" ${bold?'font-weight="bold"':''}>${xml(s)}</text>`).join('');}
let y=330;
const rows=events.map((e,i)=>{let lines=wrap(`${i+1}. ${e[2]}`,e[0]===e[1]?300:Math.abs(xs[e[0]]-xs[e[1]])-42);let h=lines.length*LH+33+(e[3]==='self'?26:0),r={e,lines,y,h,arrow:y+h-10};y+=h+9;return r;});
const BOTTOM=y+10,H=BOTTOM+155;
let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><style>text{font-family:Arial,Helvetica,sans-serif;fill:#111}path,line,rect,circle{stroke:#111;stroke-width:2;fill:none}</style><rect width="100%" height="100%" style="fill:white;stroke:none"/><defs><marker id="call" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto"><path d="M0,0L9,4L0,8Z" style="fill:#111"/></marker><marker id="reply" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto"><path d="M0,0L9,4L0,8"/></marker></defs>`;
svg+=txt('SƠ ĐỒ TUẦN TỰ TÌM KIẾM SẢN PHẨM',W/2,43,35,W-80,true);
svg+=txt('Luồng chính: tìm theo từ khóa, sắp xếp mới nhất, không chọn bộ lọc khác',W/2,84,24,W-100);
svg+=`<rect x="22" y="110" width="${W-44}" height="${BOTTOM-110}"/>`;
function glyph(k,x){let cy=164,r=24;if(k===0)return `<circle cx="${x}" cy="139" r="11"/><path d="M${x},150v34m-20,-20h40m-20,20l-23,28m23,-28l23,28"/>`;if(k===1)return `<circle cx="${x}" cy="${cy}" r="${r}"/><path d="M${x-38},136v57m0,-29h14"/>`;if(k===5)return `<rect x="${x-86}" y="137" width="172" height="54"/>`+txt(': SQL Server',x,170,24,166,true);return `<circle cx="${x}" cy="${cy}" r="${r}"/><path d="M${x+5},135l-11,7l11,6"/>`;}
const names=['Khách hàng',': ProductListComponent',': ProductsController',': StorefrontService',': AppDbContext',': SQL Server'];
const roles=['Actor','Giao diện Angular','Controller','Service','EF Core','Cơ sở dữ liệu'];
for(let i=0;i<6;i++){
 svg+=glyph(i,xs[i]);
 if(i!==5)svg+=txt(names[i],xs[i],245,25,i===0?180:330,true);
 svg+=txt(roles[i],xs[i],277,24,i===0?170:320);
 svg+=`<line x1="${xs[i]}" y1="298" x2="${xs[i]}" y2="${BOTTOM-17}" stroke-dasharray="6 8" style="stroke:#666;stroke-width:1.6"/>`;
}
const spans=[[1,0,15],[2,1,14],[3,2,13],[4,4,7],[4,8,11],[5,5,6],[5,9,10]];
for(let [lane,start,end] of spans)svg+=`<rect x="${xs[lane]-7}" y="${rows[start].arrow}" width="14" height="${rows[end].arrow-rows[start].arrow}" style="fill:white"/>`;
for(let r of rows){let [a,b,,kind]=r.e,xa=xs[a],xb=xs[b],tx=(xa+xb)/2;
 if(kind==='self'){tx=xa+165;svg+=`<rect x="${xa+2}" y="${r.arrow-27}" width="14" height="37" style="fill:white"/><path d="M${xa+7},${r.arrow-25}H${xa+92}V${r.arrow}H${xa+15}" marker-end="url(#call)"/>`;}
 else{let dir=xb>xa?1:-1,x1=xa+(a===0?0:7*dir),x2=xb-(b===0?0:7*dir);svg+=`<line x1="${x1}" y1="${r.arrow}" x2="${x2}" y2="${r.arrow}" ${kind==='return'?'stroke-dasharray="9 7"':''} marker-end="url(#${kind==='return'?'reply':'call'})"/>`;}
 for(let j=0;j<r.lines.length;j++){let t=r.lines[j],tw=t.length*FS*.54+16,ty=r.y+j*LH;svg+=`<rect x="${tx-tw/2}" y="${ty-1}" width="${tw}" height="${LH}" style="fill:white;stroke:none"/><text x="${tx}" y="${ty+FS-2}" text-anchor="middle" font-size="${FS}">${xml(t)}</text>`;}
}
svg+=txt('Hình mẫu  Sơ đồ tuần tự tìm kiếm sản phẩm theo từ khóa',W/2,BOTTOM+48,30,W-70);
svg+=txt('Giao diện bao gồm ProductListComponent và CatalogService của Angular.',W/2,BOTTOM+93,24,W-100);
svg+=txt('Các thao tác LINQ / EF Core được biểu diễn qua đường sống AppDbContext.',W/2,BOTTOM+128,24,W-100);
svg+='</svg>';
(async()=>{fs.mkdirSync(OUT,{recursive:true});let stem=path.join(OUT,'MauDuyet_SoDoTuanTu_TimKiemSanPham');fs.writeFileSync(stem+'.svg',svg);await sharp(Buffer.from(svg)).png().toFile(stem+'.png');console.log(JSON.stringify({png:stem+'.png',svg:stem+'.svg',width:W,height:H,messages:events.length}));})();
