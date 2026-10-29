$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$taskDir=$PSScriptRoot
$workingPath=Join-Path $taskDir 'working.docx'
Copy-Item -LiteralPath (Join-Path $taskDir 'input.docx') -Destination $workingPath -Force
$zip=[IO.Compression.ZipFile]::Open($workingPath,[IO.Compression.ZipArchiveMode]::Update)
function ReadPart($part){$reader=[IO.StreamReader]::new($zip.GetEntry($part).Open());try{$reader.ReadToEnd()}finally{$reader.Dispose()}}
function WritePart($part,$text){$old=$zip.GetEntry($part);if($old){$old.Delete()};$entry=$zip.CreateEntry($part);$writer=[IO.StreamWriter]::new($entry.Open(),[Text.UTF8Encoding]::new($false));try{$writer.Write($text)}finally{$writer.Dispose()}}
function EscapeXml($text){[Security.SecurityElement]::Escape([string]$text)}
try{
[xml]$doc=ReadPart 'word/document.xml'
[xml]$rels=ReadPart 'word/_rels/document.xml.rels'
$w='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
$ns=[Xml.XmlNamespaceManager]::new($doc.NameTable);$ns.AddNamespace('w',$w)
$body=$doc.SelectSingleNode('//w:body',$ns)
$sectionTemplate=$body.SelectSingleNode('./w:sectPr',$ns).CloneNode($true)
$head=$null;$anchor=$null
foreach($p in $body.SelectNodes('./w:p',$ns)){$t=($p.SelectNodes('.//w:t',$ns)|ForEach-Object{$_.InnerText}) -join '';if($t -match '^2\.2\.1 '){$head=$p};if($head -and $t -match '^2\.2\.2 '){$anchor=$p;break}}
if(!$head -or !$anchor){throw 'Cannot find subsection 2.2.1 / 2.2.2'}
$headingClone=$head.CloneNode($true)
$cursor=$head
while($cursor -and $cursor -ne $anchor){$next=$cursor.NextSibling;[void]$body.RemoveChild($cursor);$cursor=$next}
[void]$body.InsertBefore($headingClone,$anchor)
$bp=$headingClone.SelectSingleNode('w:pPr/w:pageBreakBefore',$ns);if($bp){[void]$bp.ParentNode.RemoveChild($bp)}
function InsertXml($xml){$f=$doc.CreateDocumentFragment();$f.InnerXml=$xml;[void]$body.InsertBefore($f,$anchor)}
function Para($text,$size=23,$bold=$false,$center=$false,$breakBefore=$false,$keep=$false){
$weight=if($bold){'1'}else{'0'};$align=if($center){'center'}else{'left'};$breakXml=if($breakBefore){'<w:pageBreakBefore/>'}else{''};$keepXml=if($keep){'<w:keepNext/>'}else{''}
InsertXml ('<w:p xmlns:w="'+$w+'"><w:pPr>'+$keepXml+$breakXml+'<w:spacing w:before="0" w:after="90" w:line="250" w:lineRule="auto"/><w:ind w:left="0" w:right="0" w:firstLine="0"/><w:jc w:val="'+$align+'"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b w:val="'+$weight+'"/><w:bCs w:val="'+$weight+'"/><w:i w:val="0"/><w:color w:val="000000"/><w:sz w:val="'+$size+'"/></w:rPr><w:t xml:space="preserve">'+(EscapeXml $text)+'</w:t></w:r></w:p>')
}
function SectionEnd(){
$sp=$sectionTemplate.CloneNode($true);$pg=$sp.SelectSingleNode('w:pgSz',$ns);$pg.SetAttribute('w',$w,'12240')|Out-Null;$pg.SetAttribute('h',$w,'15840')|Out-Null;$pg.RemoveAttribute('orient',$w)
$type=$sp.SelectSingleNode('w:type',$ns);if(!$type){$type=$doc.CreateElement('w','type',$w);[void]$sp.InsertBefore($type,$pg)};$type.SetAttribute('val',$w,'nextPage')|Out-Null
$p=$doc.CreateElement('w','p',$w);$pp=$doc.CreateElement('w','pPr',$w);[void]$pp.AppendChild($sp);[void]$p.AppendChild($pp);[void]$body.InsertBefore($p,$anchor)
}
$manifest=Get-Content -LiteralPath (Join-Path $taskDir 'manifest.json') -Encoding UTF8 -Raw | ConvertFrom-Json
$groups=@($manifest|Select-Object -ExpandProperty group -Unique).Count
$flows=@($manifest|Select-Object -ExpandProperty code -Unique).Count
Para ('Các biểu đồ mô tả '+$groups+' nhóm chức năng với '+$flows+' luồng tương tác của hệ thống. Các đường sống thể hiện riêng giao diện Angular, Controller, Service, AppDbContext và SQL Server theo lớp đang triển khai.')
Para 'Quy ước và phạm vi biểu đồ' 25 $true $false $false $true
Para 'Actor dùng hình người que; giao diện dùng ký hiệu boundary; Controller, Service và AppDbContext dùng ký hiệu xử lý; SQL Server dùng ô cơ sở dữ liệu như mẫu thống nhất. Mũi tên liền có đầu đặc là lời gọi, mũi tên đứt có đầu mở là trả về. Đường sống là nét đứt; thanh kích hoạt cho biết thời gian xử lý.'
Para 'Khung alt biểu diễn các lựa chọn loại trừ; opt là nhánh tùy chọn; loop là lặp; break kết thúc tương tác nếu điều kiện lỗi đúng. Khung ref dẫn tới tương tác hỗ trợ hoặc phần được mô tả riêng. Nhánh lỗi kết thúc thì không chạy các bước thành công ở phía dưới.'
Para 'Các thao tác LINQ và EF Core được trình bày qua AppDbContext; một bước truy vấn có thể đại diện nhiều câu SQL do Include, phân trang hoặc truy vấn phụ. Các đối tượng User, Product, Order và DTO được Service khởi tạo, đọc hoặc cập nhật trong bộ nhớ; không có lớp DBManager trong chuỗi xử lý.'
Para 'Giao diện trong biểu đồ bao gồm component và HTTP client Angular tương ứng. Các sơ đồ gộp nhiều phương thức chỉ chọn một thao tác ở mỗi lần gọi. API công khai chưa có lời gọi trực tiếp từ trang Angular được ghi riêng là ứng dụng gọi API. Upload tệp, callback thanh toán và tác vụ nền dùng các đường sống thực tế tương ứng.'
Para 'Các chức năng có bảo vệ lấy userId từ JWT; quản trị yêu cầu vai trò Admin. Pipeline kiểm tra truy cập và DTO; ExceptionMiddleware chuyển ngoại lệ thành lỗi HTTP. Giao dịch chưa commit được rollback khi phát sinh lỗi. Nhánh chỉ đọc không lưu dữ liệu.'
Para 'Cách đọc các phần nối tiếp' 25 $true $false $false $true
Para 'Hình có cùng mã và các phần 1/n, 2/n thuộc cùng một luồng; số thông điệp được giữ liên tục. Khi sang phần sau, yêu cầu, dữ liệu và nhánh đang thực hiện vẫn được giữ. Không hiểu phần tiếp theo là một yêu cầu HTTP mới.'
Para 'Nhóm 01–07: luồng chung và xác thực. Nhóm 08–17: mua sắm và tài khoản khách. Nhóm 18–27: quản trị cửa hàng. Nhóm 28–36: CAPTCHA, thiết lập 2FA, VNPAY, trả hàng, chatbot, dữ liệu công khai và ảnh đại diện.' 22

$usedIds=[Collections.Generic.HashSet[int]]::new()
$idNs=[Xml.XmlNamespaceManager]::new($doc.NameTable);$idNs.AddNamespace('wp','http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing')
foreach($id in $doc.SelectNodes('//wp:docPr',$idNs)){[void]$usedIds.Add([int]$id.id)}
$counter=24000
$imageMap=@{}
function AddImage($m){
while($usedIds.Contains($script:counter)){$script:counter++};$imageId=$script:counter;[void]$usedIds.Add($imageId);$script:counter++
$key=$m.code+'-'+$m.part
if($imageMap.ContainsKey($key)){$relId=$imageMap[$key]}else{
$relId='rIdApprovedSeq_'+$imageId;$file='approved_seq_'+$imageId+'.png'
$entry=$zip.CreateEntry('word/media/'+$file);$targetStream=$entry.Open();$imageStream=[IO.File]::OpenRead($m.path);try{$imageStream.CopyTo($targetStream)}finally{$imageStream.Dispose();$targetStream.Dispose()}
$rel=$rels.CreateElement('Relationship',$rels.DocumentElement.NamespaceURI);$rel.SetAttribute('Id',$relId);$rel.SetAttribute('Type','http://schemas.openxmlformats.org/officeDocument/2006/relationships/image');$rel.SetAttribute('Target','media/'+$file);[void]$rels.DocumentElement.AppendChild($rel);$imageMap[$key]=$relId
}
$width=6.5;$height=$width*$m.height/$m.width;$maxHeight=if($m.part -eq $m.parts){6.25}else{6.6};if($height -gt $maxHeight){$width=$width*$maxHeight/$height;$height=$maxHeight}
$cx=[long][Math]::Round($width*914400);$cy=[long][Math]::Round($height*914400)
$alt=EscapeXml ($m.code+' '+$m.title+'; phần '+$m.part+'/'+$m.parts)
InsertXml @"
<w:p xmlns:w="$w" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:pPr><w:keepNext/><w:spacing w:before="0" w:after="40" w:line="240" w:lineRule="auto"/><w:ind w:left="0" w:right="0" w:firstLine="0"/><w:jc w:val="left"/></w:pPr><w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0"><wp:extent cx="$cx" cy="$cy"/><wp:docPr id="$imageId" name="ApprovedSequence_$imageId" descr="$alt"/><wp:cNvGraphicFramePr/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="ApprovedSequence_$imageId"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="$relId"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="$cx" cy="$cy"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>
"@
}
foreach($m in $manifest){
$part=if($m.parts -gt 1){' — phần '+$m.part+'/'+$m.parts}else{''}
Para ($m.code+'. '+$m.title+$part) 26 $true $false $true $true
if($m.part -eq 1){Para ('Điều kiện: '+$m.pre) 21 $false $false $false $true}
AddImage $m
Para ('Hình 2.2.1-'+$m.code+'. '+$m.title+$part) 21 $false $true $false ($m.part -eq $m.parts)
if($m.part -eq $m.parts -and $m.desc){Para $m.desc 22}
}
SectionEnd
$anchorPr=$anchor.SelectSingleNode('w:pPr',$ns);if($anchorPr){$pageBreak=$anchorPr.SelectSingleNode('w:pageBreakBefore',$ns);if($pageBreak){[void]$anchorPr.RemoveChild($pageBreak)}}

# Update the old combined login/registration design figure as part of the same existing report.
$designHead=$null;$designAnchor=$null
foreach($p in $body.SelectNodes('./w:p',$ns)){$t=($p.SelectNodes('.//w:t',$ns)|ForEach-Object{$_.InnerText}) -join '';if($t -match '^3\.2\.1 '){$designHead=$p};if($designHead -and $t -match '^3\.2\.2 '){$designAnchor=$p;break}}
if($designHead -and $designAnchor){
$cursor=$designHead.NextSibling;while($cursor -and $cursor -ne $designAnchor){$next=$cursor.NextSibling;[void]$body.RemoveChild($cursor);$cursor=$next}
$anchor=$designAnchor
Para 'Thiết kế tương tác đăng ký và đăng nhập tách riêng AuthController, AuthService, TwoFactorService, RefreshTokenService và AppDbContext theo vai trò đang triển khai. Các biểu đồ dưới đây dùng cùng ký hiệu với mục 2.2.1; các tương tác bổ sung của hệ thống được trình bày ở các nhóm chức năng tương ứng trong mục đó.'
$designIndex=0
foreach($m in @($manifest|Where-Object {$_.group -eq 2 -or $_.group -eq 3})){
$designIndex++;$part=if($m.parts -gt 1){' — phần '+$m.part+'/'+$m.parts}else{''}
Para ($m.title+$part) 26 $true $false $true $true
AddImage $m
Para ('Hình 3.2.1-'+('{0:00}' -f $designIndex)+'. '+$m.title+$part) 21 $false $true
}
$pr=$designAnchor.SelectSingleNode('w:pPr',$ns);if(!$pr){$pr=$doc.CreateElement('w','pPr',$w);[void]$designAnchor.PrependChild($pr)};if(!$pr.SelectSingleNode('w:pageBreakBefore',$ns)){$b=$doc.CreateElement('w','pageBreakBefore',$w);[void]$pr.PrependChild($b)}
}
WritePart 'word/document.xml' $doc.OuterXml
WritePart 'word/_rels/document.xml.rels' $rels.OuterXml
Write-Output ('Prepared existing report update: '+$groups+' groups; '+$flows+' flows; '+$manifest.Count+' panels')
}finally{$zip.Dispose()}
