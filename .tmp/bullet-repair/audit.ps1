$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
function ReadXml($z){$r=[IO.StreamReader]::new($z.GetEntry('word/document.xml').Open());try{$x=[Xml.XmlDocument]::new();$x.LoadXml($r.ReadToEnd());return ,$x}finally{$r.Dispose()}}
function Ns($x){$n=[Xml.XmlNamespaceManager]::new($x.NameTable);$n.AddNamespace('w','http://schemas.openxmlformats.org/wordprocessingml/2006/main');$n.AddNamespace('wp','http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing');return ,$n}
$beforeZip=[IO.Compression.ZipFile]::OpenRead((Join-Path $PSScriptRoot 'input.docx'));$afterZip=[IO.Compression.ZipFile]::OpenRead((Join-Path $PSScriptRoot 'working.docx'))
try{
$before=ReadXml $beforeZip;$after=ReadXml $afterZip;$bn=Ns $before;$an=Ns $after
$originalText=($before.SelectNodes('//w:t',$bn)|ForEach-Object {$_.InnerText})-join''
$fixedText=($after.SelectNodes('//w:t',$an)|ForEach-Object {$_.InnerText})-join''
$oldIndent=@($before.SelectNodes('//w:tbl//w:pPr/w:ind',$bn)|ForEach-Object {$_.OuterXml})-join "`n"
$newIndent=@($after.SelectNodes('//w:tbl//w:pPr/w:ind',$an)|ForEach-Object {$_.OuterXml})-join "`n"
$oldDimensions=@($before.SelectNodes('//w:tbl//w:tblW|//w:tbl//w:gridCol|//w:tbl//w:tcW',$bn)|ForEach-Object {$_.OuterXml})-join "`n"
$newDimensions=@($after.SelectNodes('//w:tbl//w:tblW|//w:tbl//w:gridCol|//w:tbl//w:tcW',$an)|ForEach-Object {$_.OuterXml})-join "`n"
$reader=[IO.StreamReader]::new($afterZip.GetEntry('word/styles.xml').Open());try{[xml]$styles=$reader.ReadToEnd()}finally{$reader.Dispose()};$styleNs=Ns $styles
function FontFromStyle($id){$seen=@{};while($id -and !$seen.ContainsKey($id)){$seen[$id]=$true;$style=$styles.SelectSingleNode('//w:style[@w:styleId="'+$id+'"]',$styleNs);if(!$style){break};$fonts=$style.SelectSingleNode('w:rPr/w:rFonts',$styleNs);if($fonts){foreach($key in @('hAnsi','ascii')){$value=$fonts.GetAttribute($key,$styleNs.LookupNamespace('w'));if($value){return $value}}};$parent=$style.SelectSingleNode('w:basedOn',$styleNs);$id=if($parent){$parent.GetAttribute('val',$styleNs.LookupNamespace('w'))}else{$null}};return $null}
$defaultStyle=$styles.SelectSingleNode('//w:style[@w:type="paragraph" and @w:default="1"]',$styleNs).GetAttribute('styleId',$styleNs.LookupNamespace('w'))
$glyphs=@($after.SelectNodes('//w:t[starts-with(.,"•")]',$an));$safe=@();$unsafe=@()
foreach($t in $glyphs){$run=$t.ParentNode;$fonts=$run.SelectSingleNode('w:rPr/w:rFonts',$an);$font=$null;if($fonts){foreach($key in @('hAnsi','ascii')){$v=$fonts.GetAttribute($key,$an.LookupNamespace('w'));if($v){$font=$v;break}}};if(!$font){$rs=$run.SelectSingleNode('w:rPr/w:rStyle',$an);if($rs){$font=FontFromStyle ($rs.GetAttribute('val',$an.LookupNamespace('w')))}};if(!$font){$p=$run.SelectSingleNode('ancestor::w:p',$an);$ps=$p.SelectSingleNode('w:pPr/w:pStyle',$an);$font=FontFromStyle $(if($ps){$ps.GetAttribute('val',$an.LookupNamespace('w'))}else{$defaultStyle})};if(!$font){$font=FontFromStyle $defaultStyle};if($font -eq 'Times New Roman'){$safe+=$t}else{$unsafe+=[pscustomobject]@{text=$t.InnerText;font=$font}}}
$sameMedia=$true;$imageCount=0
foreach($entry in $beforeZip.Entries|Where-Object {$_.FullName -like 'word/media/*'}){$other=$afterZip.GetEntry($entry.FullName);if(!$other){$sameMedia=$false;break};$sha=[Security.Cryptography.SHA256]::Create();$a=$entry.Open();$b=$other.Open();try{$aHash=[BitConverter]::ToString($sha.ComputeHash($a));$bHash=[BitConverter]::ToString($sha.ComputeHash($b));if($aHash -cne $bHash){$sameMedia=$false}}finally{$a.Dispose();$b.Dispose();$sha.Dispose()};$imageCount++}
$result=[ordered]@{onlyBulletTextChanged=($fixedText -ceq $originalText.Replace('➢','•'));remainingFaultyArrows=$after.SelectNodes('//w:t[contains(.,"➢")]',$an).Count;safeFontBullets=$safe.Count;unsafeFonts=$unsafe;tableIndentsUnchanged=($oldIndent -ceq $newIndent);tableWidthsUnchanged=($oldDimensions -ceq $newDimensions);allImagesUnchanged=$sameMedia;imagesCompared=$imageCount;sequenceDiagrams=@($after.SelectNodes('//wp:docPr',$an)|Where-Object {$_.name -like 'UnifiedSequence_*'}).Count}
$result|ConvertTo-Json|Set-Content (Join-Path $PSScriptRoot 'verification.json') -Encoding UTF8;$result|ConvertTo-Json
if(!$result.onlyBulletTextChanged -or $result.remainingFaultyArrows -or $result.safeFontBullets -lt 224 -or $unsafe.Count -gt 0 -or !$result.tableIndentsUnchanged -or !$result.tableWidthsUnchanged -or !$result.allImagesUnchanged -or $result.sequenceDiagrams -ne 40){throw 'Bullet repair verification failed'}
}finally{$beforeZip.Dispose();$afterZip.Dispose()}
