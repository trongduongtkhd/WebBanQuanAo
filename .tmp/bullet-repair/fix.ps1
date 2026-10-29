$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
$inputPath=Join-Path $PSScriptRoot 'input.docx';$workingPath=Join-Path $PSScriptRoot 'working.docx'
Copy-Item -LiteralPath $inputPath -Destination $workingPath -Force
$zip=[IO.Compression.ZipFile]::Open($workingPath,[IO.Compression.ZipArchiveMode]::Update)
try{
$rd=[IO.StreamReader]::new($zip.GetEntry('word/document.xml').Open());try{$doc=[Xml.XmlDocument]::new();$doc.PreserveWhitespace=$true;$doc.LoadXml($rd.ReadToEnd())}finally{$rd.Dispose()}
$w='http://schemas.openxmlformats.org/wordprocessingml/2006/main';$ns=[Xml.XmlNamespaceManager]::new($doc.NameTable);$ns.AddNamespace('w',$w)
$original=($doc.SelectNodes('//w:t',$ns)|ForEach-Object {$_.InnerText})-join''
$fixed=0;$inTables=0;$samples=@()
foreach($p in $doc.SelectNodes('//w:p',$ns)){
 $first=$null;foreach($t in $p.SelectNodes('./w:r/w:t',$ns)){if($t.InnerText.Trim().Length){$first=$t;break}}
 if(!$first -or $first.InnerText.Trim() -cne '➢'){continue}
 $first.InnerText=$first.InnerText.Replace('➢','•')
 $run=$first.ParentNode;$pr=$run.SelectSingleNode('w:rPr',$ns);if(!$pr){$pr=$doc.CreateElement('w','rPr',$w);[void]$run.PrependChild($pr)}
 $fonts=$pr.SelectSingleNode('w:rFonts',$ns);if(!$fonts){$fonts=$doc.CreateElement('w','rFonts',$w);[void]$pr.PrependChild($fonts)}
 foreach($a in @($fonts.Attributes)){if($a.LocalName -match '(?i)theme$'){$fonts.RemoveAttributeNode($a)|Out-Null}}
 foreach($attr in @('ascii','hAnsi','eastAsia','cs')){$fonts.SetAttribute($attr,$w,'Times New Roman')|Out-Null}
 $fixed++;if($p.SelectSingleNode('ancestor::w:tbl',$ns)){$inTables++}
 if($samples.Count -lt 5){$samples+=(($p.SelectNodes('.//w:t',$ns)|ForEach-Object {$_.InnerText})-join'')}
}
$after=($doc.SelectNodes('//w:t',$ns)|ForEach-Object {$_.InnerText})-join''
if($after -cne $original.Replace('➢','•')){throw 'Unexpected change to report text or a non-prefix arrow requires review'}
$remaining=$doc.SelectNodes('//w:t[contains(.,"➢")]',$ns).Count
if($remaining -ne 0 -or $fixed -lt 1){throw 'Bullet repair was incomplete'}
$zip.GetEntry('word/document.xml').Delete();$entry=$zip.CreateEntry('word/document.xml');$wr=[IO.StreamWriter]::new($entry.Open(),[Text.UTF8Encoding]::new($false));try{$wr.Write($doc.OuterXml)}finally{$wr.Dispose()}
$result=[ordered]@{replaced=$fixed;insideTables=$inTables;remainingFaultyGlyphs=$remaining;font='Times New Roman';replacement='U+2022';otherTextUnchanged=$true;samples=$samples}
$result|ConvertTo-Json -Depth 4|Set-Content (Join-Path $PSScriptRoot 'repair-audit.json') -Encoding UTF8
$result|ConvertTo-Json -Depth 4
}finally{$zip.Dispose()}
