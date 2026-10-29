$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$taskDir=$PSScriptRoot
$outputPath=Join-Path (Split-Path (Split-Path $taskDir)) 'src\Docs\BaoCaoDoAn3_CapNhat_2_2_1_TrangDoc.docx'
$sourcePath=Join-Path $taskDir 'source.docx'
Copy-Item -LiteralPath $sourcePath -Destination $outputPath -Force
$zip=[IO.Compression.ZipFile]::Open($outputPath,[IO.Compression.ZipArchiveMode]::Update)
function ReadPart($part){$reader=[IO.StreamReader]::new($zip.GetEntry($part).Open());try{$reader.ReadToEnd()}finally{$reader.Dispose()}}
function WritePart($part,$text){$old=$zip.GetEntry($part);if($old){$old.Delete()};$entry=$zip.CreateEntry($part);$writer=[IO.StreamWriter]::new($entry.Open(),[Text.UTF8Encoding]::new($false));try{$writer.Write($text)}finally{$writer.Dispose()}}
try{
[xml]$doc=ReadPart 'word/document.xml'
[xml]$rels=ReadPart 'word/_rels/document.xml.rels'
[xml]$types=ReadPart '[Content_Types].xml'
$w='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
$ns=[Xml.XmlNamespaceManager]::new($doc.NameTable);$ns.AddNamespace('w',$w)
$body=$doc.SelectSingleNode('//w:body',$ns)
$start=$null;$anchor=$null
foreach($p in $body.SelectNodes('./w:p',$ns)){$t=($p.SelectNodes('.//w:t',$ns)|ForEach-Object {$_.InnerText}) -join '';if($t -match '^2\.2\.1 Các biểu đồ'){$start=$p};if($start -and $t -match '^2\.2\.2 Góc nhìn'){$anchor=$p;break}}
if(!$start -or !$anchor){throw 'Section boundaries not found'}
$originalSection=$body.SelectSingleNode('./w:sectPr',$ns).CloneNode($true)
function Esc($s){[Security.SecurityElement]::Escape([string]$s)}
function InsertXml($xml){$f=$doc.CreateDocumentFragment();$f.InnerXml=$xml;[void]$body.InsertBefore($f,$anchor)}
function Para($text,$size=24,$bold=$false,$center=$false,$breakBefore=$false,$keep=$false){
$b=if($bold){'<w:b/><w:bCs/>'}else{'<w:b w:val="0"/><w:bCs w:val="0"/>'};$a=if($center){'center'}else{'left'};$pb=if($breakBefore){'<w:pageBreakBefore/>'}else{''};$kp=if($keep){'<w:keepNext/>'}else{''}
$headingStyle=if($text -match '^2\.2\.1 '){'<w:pStyle w:val="u3"/>'}else{''}
InsertXml ('<w:p xmlns:w="'+$w+'"><w:pPr>'+$headingStyle+$kp+$pb+'<w:spacing w:before="0" w:after="100" w:line="250" w:lineRule="auto"/><w:ind w:left="0" w:right="0" w:firstLine="0"/><w:jc w:val="'+$a+'"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="'+$size+'"/><w:color w:val="000000"/><w:i w:val="0"/><w:iCs w:val="0"/>'+$b+'</w:rPr><w:t xml:space="preserve">'+(Esc $text)+'</w:t></w:r></w:p>')
}
function SectionEnd($landscape){$sp=$originalSection.CloneNode($true);$type=$sp.SelectSingleNode('w:type',$ns);if(!$type){$type=$doc.CreateElement('w','type',$w);[void]$sp.InsertBefore($type,$sp.SelectSingleNode('w:pgSz',$ns))};$type.SetAttribute('val',$w,'nextPage');if($landscape){$pg=$sp.SelectSingleNode('w:pgSz',$ns);$pg.SetAttribute('w',$w,'15840');$pg.SetAttribute('h',$w,'12240');$pg.SetAttribute('orient',$w,'landscape');$mar=$sp.SelectSingleNode('w:pgMar',$ns);foreach($attr in @('top','bottom')){$mar.SetAttribute($attr,$w,'640')};foreach($attr in @('left','right')){$mar.SetAttribute($attr,$w,'720')};$mar.SetAttribute('footer',$w,'320');$mar.SetAttribute('header',$w,'320')};$p=$doc.CreateElement('w','p',$w);$pp=$doc.CreateElement('w','pPr',$w);[void]$pp.AppendChild($sp);[void]$p.AppendChild($pp);[void]$body.InsertBefore($p,$anchor)}
$previous=$start.PreviousSibling
$cursor=$start
while($cursor -and $cursor -ne $anchor){$next=$cursor.NextSibling;[void]$body.RemoveChild($cursor);$cursor=$next}
# Finish the unchanged portrait section before introducing the revised subsection.
SectionEnd $false
Para '2.2.1 Các biểu đồ tuần tự (Sequence diagrams)' 28 $true $false $false $true
Para 'Các biểu đồ trình bày tương tác của hệ thống bán quần áo theo 27 nhóm chức năng. Luồng được đối chiếu với Controller và Service trong mã nguồn; thời gian diễn tiến từ trên xuống.'
Para 'Quy ước ký hiệu và mức mô hình hóa' 26 $true $false $false $true
Para 'Actor là người que. Form dùng vòng tròn có vạch đứng bên trái. Control và DBManager dùng vòng tròn có mũi tên nhỏ phía trên. Entity là vòng tròn có gạch ngang bên dưới. Database dùng hình vuông có hai đường chéo theo quy ước của báo cáo.'
Para 'Form đại diện giao diện Angular; Control đại diện xử lý của Controller và Service tương ứng. DBManager ánh xạ AppDbContext và EF Core, không hàm ý có thêm lớp DBManager trong mã nguồn. Entity là đối tượng dữ liệu trong bộ nhớ, không tự gọi SQL. Database là SQL Server; chỉ DBManager trao đổi với cơ sở dữ liệu.'
Para 'Mũi tên liền có đầu đặc biểu diễn lời gọi đồng bộ; mũi tên đứt có đầu mở biểu diễn trả về. Đường sống là nét đứt thẳng đứng; thanh kích hoạt biểu diễn thời gian xử lý. Khung alt chứa các nhánh thay thế; opt chứa nhánh tùy chọn; ref tham chiếu tương tác. Điều kiện đặt trong dấu ngoặc vuông. Chú thích có góc gấp không phải thông điệp.'
Para 'Một sơ đồ dài được chia thành các phần nối tiếp, giữ nguyên trạng thái và điều kiện của nhánh đang xử lý. Số thứ tự thông điệp được đánh lại trong từng phần. Các luồng được ghi là độc lập là những yêu cầu HTTP riêng, không phải thao tác luôn chạy liên tiếp.'
Para 'Các yêu cầu của khách hàng đã đăng nhập lấy userId từ phiên xác thực. Chức năng quản trị yêu cầu vai trò Admin. Pipeline kiểm tra quyền trước nghiệp vụ. Trừ khi biểu đồ nêu riêng, lỗi dữ liệu hoặc ngoại lệ dừng xử lý và trả lỗi; không tiếp tục lưu hay trả kết quả thành công. Giao dịch chưa commit bị rollback khi có lỗi.'
Para 'Cơ sở ký pháp: OMG UML 2.5.1, Chương 17 Interactions; bộ biểu tượng BCE và biểu tượng Database được thống nhất theo quy ước minh họa của báo cáo (https://www.omg.org/spec/UML/2.5.1).' 22
SectionEnd $false
$manifest=Get-Content -LiteralPath (Join-Path $taskDir 'manifest.json') -Raw -Encoding UTF8|ConvertFrom-Json
$counter=5000
foreach($m in $manifest){
$counter++;$id='rIdSequence2026_'+$counter;$file='sequence2026_'+$counter+'.png'
$entry=$zip.CreateEntry('word/media/'+$file);$target=$entry.Open();$input=[IO.File]::OpenRead($m.path);try{$input.CopyTo($target)}finally{$input.Dispose();$target.Dispose()}
$rel=$rels.CreateElement('Relationship',$rels.DocumentElement.NamespaceURI);$rel.SetAttribute('Id',$id);$rel.SetAttribute('Type','http://schemas.openxmlformats.org/officeDocument/2006/relationships/image');$rel.SetAttribute('Target','media/'+$file);[void]$rels.DocumentElement.AppendChild($rel)
$partLabel=if($m.parts -gt 1){' — phần '+$m.part+'/'+$m.parts}else{''}
Para (($m.number.ToString())+'. '+$m.title+$partLabel) 26 $true $false ($counter -gt 5001) $true
if($m.part -eq 1){Para ('Yêu cầu: '+$m.req+'. Điều kiện: '+$m.pre) 22 $false $false $false $true}
$width=6.5;$height=$width*$m.height/$m.width
# Reserve space for the heading, caption, and an explanatory paragraph on the last panel.
$heightLimit=if($m.part -eq $m.parts){6.8}else{7.4}
if($height -gt $heightLimit){$width=$width*$heightLimit/$height;$height=$heightLimit}
$cx=[long][Math]::Round($width*914400);$cy=[long][Math]::Round($height*914400)
$altText=Esc ('Hình 2.2.1-'+('{0:00}' -f $m.number)+' '+$m.title+$partLabel)
InsertXml @"
<w:p xmlns:w="$w" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:pPr><w:keepNext/><w:ind w:left="0" w:right="0" w:firstLine="0"/><w:jc w:val="left"/><w:spacing w:before="0" w:after="40" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0"><wp:extent cx="$cx" cy="$cy"/><wp:docPr id="$counter" name="$file" descr="$altText"/><wp:cNvGraphicFramePr/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="$file"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="$id"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="$cx" cy="$cy"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>
"@
Para ('Hình 2.2.1-'+('{0:00}' -f $m.number)+'. Sơ đồ tuần tự '+$m.title.ToLower()+$partLabel) 22 $false $true $false ($m.part -eq $m.parts)
if($m.part -eq $m.parts){Para $m.desc 22}
}
SectionEnd $false
# Keep the following original subsection on its original portrait layout.
$anchorPPr=$anchor.SelectSingleNode('w:pPr',$ns);if($anchorPPr){$pb=$anchorPPr.SelectSingleNode('w:pageBreakBefore',$ns);if($pb){[void]$anchorPPr.RemoveChild($pb)}}
WritePart 'word/document.xml' $doc.OuterXml
WritePart 'word/_rels/document.xml.rels' $rels.OuterXml
WritePart '[Content_Types].xml' $types.OuterXml
Write-Output ('Updated document: '+$outputPath)
Write-Output ('Logical diagrams: 27; image panels: '+$manifest.Count)
}finally{$zip.Dispose()}
