$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
function LoadDoc($path){$z=[IO.Compression.ZipFile]::OpenRead($path);try{$rd=[IO.StreamReader]::new($z.GetEntry('word/document.xml').Open());try{[xml]$x=$rd.ReadToEnd()}finally{$rd.Dispose()};return ,$x}finally{$z.Dispose()}}
$old=LoadDoc (Join-Path $PSScriptRoot 'input.docx');$new=LoadDoc (Join-Path $PSScriptRoot 'working.docx')
function Ns($x){$n=[Xml.XmlNamespaceManager]::new($x.NameTable);$n.AddNamespace('w','http://schemas.openxmlformats.org/wordprocessingml/2006/main');$n.AddNamespace('wp','http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing');$n.AddNamespace('a','http://schemas.openxmlformats.org/drawingml/2006/main');$n.AddNamespace('r','http://schemas.openxmlformats.org/officeDocument/2006/relationships');return ,$n}
function OutsideText($x){$n=Ns $x;$skip=$false;$texts=[Collections.Generic.List[string]]::new();foreach($e in $x.SelectSingleNode('//w:body',$n).ChildNodes){$t=($e.SelectNodes('.//w:t[not(ancestor::w:hyperlink[starts-with(@w:anchor,"_Toc")])]',$n)|ForEach-Object {$_.InnerText})-join'';if($t -match '^2\.2\.1 ' -or $t -match '^3\.2\.1 '){$skip=$true};if($t -match '^2\.2\.2 ' -or $t -match '^3\.2\.2 '){$skip=$false};if(!$skip -and $t){$texts.Add($t)}};return $texts -join "`n"}
$ns=Ns $new
$sections=@($new.SelectNodes('//w:sectPr/w:pgSz',$ns)|ForEach-Object {$_.GetAttribute('w',$ns.LookupNamespace('w'))+'x'+$_.GetAttribute('h',$ns.LookupNamespace('w'))}|Select-Object -Unique)
$ids=@($new.SelectNodes('//wp:docPr',$ns)|ForEach-Object {$_.GetAttribute('id')})
$dup=@($ids|Group-Object|Where-Object {$_.Count -gt 1})
$approved=@($new.SelectNodes('//wp:docPr',$ns)|Where-Object {$_.name -like 'UnifiedSequence_*'})
$target=Join-Path (Split-Path (Split-Path $PSScriptRoot)) 'src\Docs\BaoCaoDoAn3_CapNhat_2_2_1_TrangDoc.docx'
$hashOld=(Get-FileHash -LiteralPath (Join-Path $PSScriptRoot 'input.docx')).Hash
$hashTarget=(Get-FileHash -LiteralPath $target).Hash
$result=[ordered]@{outsideSectionTextPreserved=((OutsideText $old) -ceq (OutsideText $new));sectionSizes=$sections;duplicateDrawingIds=$dup.Count;approvedImages=$approved.Count;targetUnchangedSinceSnapshot=($hashOld -eq $hashTarget);workingLength=(Get-Item (Join-Path $PSScriptRoot 'working.docx')).Length}
$result|ConvertTo-Json|Set-Content (Join-Path $PSScriptRoot 'package-audit.json') -Encoding UTF8
$result|ConvertTo-Json
if(!$result.outsideSectionTextPreserved -or $dup.Count -gt 0 -or !$result.targetUnchangedSinceSnapshot -or $approved.Count -ne 40){throw 'Document package audit failed'}

