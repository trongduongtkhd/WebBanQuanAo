$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$taskDir=$PSScriptRoot
$sourcePath=Join-Path $taskDir 'source.docx'
$inputPath=Join-Path $taskDir 'input.docx'
$workingPath=Join-Path $taskDir 'working.docx'
Copy-Item -LiteralPath $inputPath -Destination $workingPath -Force
$sourceZip=[IO.Compression.ZipFile]::OpenRead($sourcePath)
$targetZip=[IO.Compression.ZipFile]::Open($workingPath,[IO.Compression.ZipArchiveMode]::Update)
function ReadXml($archive,$part){$rd=[IO.StreamReader]::new($archive.GetEntry($part).Open());try{$x=[Xml.XmlDocument]::new();$x.PreserveWhitespace=$true;$x.LoadXml($rd.ReadToEnd());return ,$x}finally{$rd.Dispose()}}
function WriteXml($archive,$part,$x){$old=$archive.GetEntry($part);if($old){$old.Delete()};$entry=$archive.CreateEntry($part);$writer=[IO.StreamWriter]::new($entry.Open(),[Text.UTF8Encoding]::new($false));try{$writer.Write($x.OuterXml)}finally{$writer.Dispose()}}
function Ns($x){$n=[Xml.XmlNamespaceManager]::new($x.NameTable);$n.AddNamespace('w','http://schemas.openxmlformats.org/wordprocessingml/2006/main');$n.AddNamespace('wp','http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing');$n.AddNamespace('w14','http://schemas.microsoft.com/office/word/2010/wordml');$n.AddNamespace('r','http://schemas.openxmlformats.org/officeDocument/2006/relationships');return ,$n}
function TextOf($node,$ns){return ($node.SelectNodes('.//w:t',$ns)|ForEach-Object {$_.InnerText})-join''}
try{
$sourceDoc=ReadXml $sourceZip 'word/document.xml';$sourceNs=Ns $sourceDoc
$targetDoc=ReadXml $targetZip 'word/document.xml';$targetNs=Ns $targetDoc
$sourceRels=ReadXml $sourceZip 'word/_rels/document.xml.rels';$targetRels=ReadXml $targetZip 'word/_rels/document.xml.rels'
$types=ReadXml $targetZip '[Content_Types].xml'
$sourceNodes=@($sourceDoc.SelectSingleNode('//w:body',$sourceNs).ChildNodes|Where-Object {$_.NodeType -eq [Xml.XmlNodeType]::Element})
$startIndex=-1;$endIndex=-1
for($i=0;$i -lt $sourceNodes.Count;$i++){if($sourceNodes[$i].LocalName -ne 'p'){continue};$t=TextOf $sourceNodes[$i] $sourceNs;if($t -match '^1\.5\.3\s'){$startIndex=$i};if($startIndex -ge 0 -and $t -match '^2\.\s*PHÂN TÍCH'){$endIndex=$i;break}}
if($startIndex -lt 0 -or $endIndex -le $startIndex){throw 'Cannot isolate source subsection 1.5.3'}
$sourceSection=@($sourceNodes[$startIndex..($endIndex-1)])
$body=$targetDoc.SelectSingleNode('//w:body',$targetNs);$anchor=$null;$existing=$null
foreach($p in $body.SelectNodes('./w:p',$targetNs)){$t=TextOf $p $targetNs;if($t -match '^1\.5\.3\s'){$existing=$p};if($t -match '^2\.\s*PHÂN TÍCH'){$anchor=$p;break}}
if(!$anchor){throw 'Cannot locate insertion boundary before chapter 2'}
if($existing){$cursor=$existing;while($cursor -and $cursor -ne $anchor){$next=$cursor.NextSibling;[void]$body.RemoveChild($cursor);$cursor=$next}}

# Both files share these styles, defaults and theme. Verify before preserving the XML verbatim.
$sourceStyles=ReadXml $sourceZip 'word/styles.xml';$targetStyles=ReadXml $targetZip 'word/styles.xml';$sourceStyleNs=Ns $sourceStyles;$targetStyleNs=Ns $targetStyles
$styleIds=@($sourceSection|ForEach-Object {$_.SelectNodes('.//w:pStyle|.//w:rStyle|.//w:tblStyle',$sourceNs)}|ForEach-Object {$_.GetAttribute('val',$sourceNs.LookupNamespace('w'))}|Select-Object -Unique)
$styleIds+=@('Binhthng','u3Char','u4Char')
foreach($id in $styleIds){$a=$sourceStyles.SelectSingleNode('//w:style[@w:styleId="'+$id+'"]',$sourceStyleNs);$b=$targetStyles.SelectSingleNode('//w:style[@w:styleId="'+$id+'"]',$targetStyleNs);if($a.OuterXml -cne $b.OuterXml){throw ('Style differs and requires explicit import: '+$id)}}
if($sourceStyles.SelectSingleNode('//w:docDefaults',$sourceStyleNs).OuterXml -cne $targetStyles.SelectSingleNode('//w:docDefaults',$targetStyleNs).OuterXml){throw 'Document defaults differ'}
if((ReadXml $sourceZip 'word/theme/theme1.xml').OuterXml -cne (ReadXml $targetZip 'word/theme/theme1.xml').OuterXml){throw 'Document themes differ'}

$usedDrawingIds=[Collections.Generic.HashSet[int]]::new();foreach($e in $targetDoc.SelectNodes('//wp:docPr',$targetNs)){[void]$usedDrawingIds.Add([int]$e.id)}
$usedParaIds=[Collections.Generic.HashSet[string]]::new();foreach($a in $targetDoc.SelectNodes('//@w14:paraId',$targetNs)){[void]$usedParaIds.Add($a.Value)}
$drawingId=62000;$relationships=@{};$imageMap=@();$inserted=@()
foreach($original in $sourceSection){
 $node=$targetDoc.ImportNode($original,$true)
 foreach($a in @($node.SelectNodes('.//@r:embed|.//@r:id|.//@r:link',$targetNs))){$oldId=$a.Value;if(!$relationships.ContainsKey($oldId)){
  $sourceRel=@($sourceRels.Relationships.Relationship|Where-Object {$_.Id -eq $oldId})[0];if(!$sourceRel){throw ('Missing source relationship '+$oldId)}
  $newId='rIdSpec153_'+($relationships.Count+1);$newRel=$targetRels.CreateElement('Relationship',$targetRels.DocumentElement.NamespaceURI);$newRel.SetAttribute('Id',$newId);$newRel.SetAttribute('Type',$sourceRel.Type)
  if($sourceRel.TargetMode -eq 'External'){$newRel.SetAttribute('Target',$sourceRel.Target);$newRel.SetAttribute('TargetMode','External')}
  else{
   if($sourceRel.Type -notlike '*/image'){throw ('Unexpected internal relationship '+$sourceRel.Type)}
   $entry=$sourceZip.GetEntry('word/'+$sourceRel.Target);if(!$entry){throw 'Missing source image'}
   $extension=[IO.Path]::GetExtension($sourceRel.Target);$fileName='spec153_'+($relationships.Count+1)+$extension;$newTarget='media/'+$fileName
   $newEntry=$targetZip.CreateEntry('word/'+$newTarget);$read=$entry.Open();$write=$newEntry.Open();try{$read.CopyTo($write)}finally{$read.Dispose();$write.Dispose()};$newRel.SetAttribute('Target',$newTarget)
   $imageMap+=[pscustomobject]@{sourceId=$oldId;targetId=$newId;source=$entry.FullName;target='word/'+$newTarget}
  }
  [void]$targetRels.DocumentElement.AppendChild($newRel);$relationships[$oldId]=$newId
 };$a.Value=$relationships[$oldId]}
 foreach($e in $node.SelectNodes('.//wp:docPr',$targetNs)){while($usedDrawingIds.Contains($drawingId)){$drawingId++};$e.SetAttribute('id',[string]$drawingId);[void]$usedDrawingIds.Add($drawingId);$drawingId++}
 foreach($a in $node.SelectNodes('.//@w14:paraId',$targetNs)){if($usedParaIds.Contains($a.Value)){do{$a.Value=[Guid]::NewGuid().ToString('N').Substring(0,8).ToUpperInvariant()}while($usedParaIds.Contains($a.Value))};[void]$usedParaIds.Add($a.Value)}
 [void]$body.InsertBefore($node,$anchor);$inserted+=$node
}
# PNG is already used throughout the destination report; require a registered content type.
$typeNs=[Xml.XmlNamespaceManager]::new($types.NameTable);$typeNs.AddNamespace('ct',$types.DocumentElement.NamespaceURI)
foreach($ext in @($imageMap|ForEach-Object {[IO.Path]::GetExtension($_.target).TrimStart('.')}|Select-Object -Unique)){if(!$types.SelectSingleNode('//ct:Default[@Extension="'+$ext+'"]',$typeNs)){throw ('Unregistered image content type '+$ext)}}
WriteXml $targetZip 'word/document.xml' $targetDoc
WriteXml $targetZip 'word/_rels/document.xml.rels' $targetRels
$sourceText=($sourceSection|ForEach-Object {TextOf $_ $sourceNs})-join "`n"
$copiedText=($inserted|ForEach-Object {TextOf $_ $targetNs})-join "`n"
if($sourceText -cne $copiedText){throw 'Text changed during section copy'}
[IO.File]::WriteAllText((Join-Path $taskDir 'source-section.txt'),$sourceText,[Text.UTF8Encoding]::new($false))
$imageMap|ConvertTo-Json -Depth 4|Set-Content (Join-Path $taskDir 'image-map.json') -Encoding UTF8
$result=[ordered]@{sourceNodes=$sourceSection.Count;copiedNodes=$inserted.Count;tables=@($inserted|Where-Object {$_.LocalName -eq 'tbl'}).Count;images=$imageMap.Count;textIdentical=$true;stylesIdentical=$true;paragraphs=($sourceSection|ForEach-Object {$_.SelectNodes('descendant-or-self::w:p',$sourceNs)}).Count}
$result|ConvertTo-Json|Set-Content (Join-Path $taskDir 'copy-audit.json') -Encoding UTF8
$result|ConvertTo-Json
}finally{$targetZip.Dispose();$sourceZip.Dispose()}
