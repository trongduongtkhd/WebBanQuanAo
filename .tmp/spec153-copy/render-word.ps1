param([string]$Document='working.docx',[switch]$Full,[switch]$AuditOnly)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$taskDir=$PSScriptRoot
$path=Join-Path $taskDir $Document
$label=[IO.Path]::GetFileNameWithoutExtension($Document)
$outDir=Join-Path $taskDir ($label+'-pages');[void][IO.Directory]::CreateDirectory($outDir)
function FindHeading($doc,$text){$start=$doc.Content.Start;if($doc.TablesOfContents.Count -gt 0){$start=$doc.TablesOfContents.Item(1).Range.End};$scan=$doc.Range($start,$doc.Content.End);$scan.Find.ClearFormatting();$scan.Find.Text=$text;$scan.Find.MatchWildcards=$false;$scan.Find.MatchCase=$false;$scan.Find.MatchWholeWord=$false;$scan.Find.Forward=$true;$scan.Find.Wrap=0;if(!$scan.Find.Execute()){throw ('Heading missing: '+$text)};return ,$scan.Paragraphs.Item(1).Range.Duplicate}
$word=New-Object -ComObject Word.Application
$owned=($word.Documents.Count -eq 0)
$word.Visible=$true;$word.DisplayAlerts=0
try{
$doc=$word.Documents.Open($path,$false,($label -eq 'source'))
Write-Output ('Opened '+$Document)
$doc.ActiveWindow.View.Type=3
$doc.Repaginate()
Write-Output 'Pagination complete'
if($label -ne 'source'){foreach($toc in $doc.TablesOfContents){$toc.Update()};$doc.Save();$doc.Repaginate()}
$total=$doc.ComputeStatistics(2)
$head=FindHeading $doc '1.5.3 Đặc tả use-case'
$next=FindHeading $doc '2. PHÂN TÍCH TRƯỜNG HỢP SỬ DỤNG (USE-CASE ANALYSIS)'
$range=$doc.Range($head.Start,$next.Start)
[IO.File]::WriteAllText((Join-Path $taskDir ($label+'-native-section.txt')),$range.Text,[Text.UTF8Encoding]::new($false))
$first=$head.Information(3);$last=$doc.Range($next.Start-1,$next.Start).Information(3)
$data=[ordered]@{document=$Document;pages=$total;first=$first;last=$last;nextChapterPage=$next.Information(3);tables=$range.Tables.Count;images=$range.InlineShapes.Count}
$data|ConvertTo-Json -Depth 5|Set-Content (Join-Path $taskDir ($label+'-word-audit.json')) -Encoding UTF8
Write-Output ($Document+': '+$total+' pages; section 1.5.3 on pages '+$first+'-'+$last+'; '+$data.tables+' tables and '+$data.images+' images')
if($AuditOnly){$doc.Close(0);$doc=$null;return}
$pages=$doc.ActiveWindow.Panes.Item(1).Pages
$renderFirst=if($Full){1}else{[Math]::Max(1,$first-1)}
$renderLast=if($Full){$total}else{[Math]::Min($total,$next.Information(3)+1)}
for($i=$renderFirst;$i -le $renderLast;$i++){
$bytes=[byte[]]$pages.Item($i).EnhMetaFileBits
$stream=[IO.MemoryStream]::new($bytes,$false)
$meta=[Drawing.Imaging.Metafile]::new($stream)
$width=1600;$height=[int][Math]::Round($width*$meta.Height/$meta.Width)
$bitmap=[Drawing.Bitmap]::new($width,$height);$graphics=[Drawing.Graphics]::FromImage($bitmap)
$graphics.Clear([Drawing.Color]::White);$graphics.SmoothingMode=[Drawing.Drawing2D.SmoothingMode]::HighQuality;$graphics.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.DrawImage($meta,0,0,$width,$height)
$bitmap.Save((Join-Path $outDir ('page-'+$i+'.png')),[Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose();$bitmap.Dispose();$meta.Dispose();$stream.Dispose()
if($i%10 -eq 0){Write-Output ('Rendered '+$label+' page '+$i)}
}
$doc.Close(0);$doc=$null
Write-Output ('Rendering complete: '+$label)
}finally{if($doc){try{$doc.Close(0)}catch{}};if($owned){try{$word.Quit()}catch{}}}
