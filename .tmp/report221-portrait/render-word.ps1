param([int]$First=1,[int]$Last=0)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$taskDir=$PSScriptRoot
$reportPath=Join-Path (Split-Path (Split-Path $taskDir)) 'src\Docs\BaoCaoDoAn3_CapNhat_2_2_1_TrangDoc.docx'
$outDir=Join-Path $taskDir 'word-pages';[void][IO.Directory]::CreateDirectory($outDir)
$word=New-Object -ComObject Word.Application
$word.Visible=$true;$word.DisplayAlerts=0
try{
$doc=$word.Documents.Open($reportPath,$false,$false)
$doc.ActiveWindow.View.Type=3
$doc.Repaginate()
foreach($toc in $doc.TablesOfContents){$toc.Update()}
$doc.Save()
$total=$doc.ComputeStatistics(2)
Write-Output ('Document opened: '+$total+' pages')
$allPages=$doc.ActiveWindow.Panes.Item(1).Pages
Write-Output ('Pages collection: '+$allPages.Count)
if($Last -eq 0){$Last=$total}
for($i=$First;$i -le [Math]::Min($Last,$total);$i++){
$bits=$allPages.Item($i).EnhMetaFileBits
$bytes=[byte[]]$bits
$stream=[IO.MemoryStream]::new($bytes,$false)
$meta=[Drawing.Imaging.Metafile]::new($stream)
$bounds=$meta.GetBounds([ref][Drawing.GraphicsUnit]::Pixel)
$width=1600;$height=[int][Math]::Round($width*$meta.Height/$meta.Width)
$bitmap=[Drawing.Bitmap]::new($width,$height)
$graphics=[Drawing.Graphics]::FromImage($bitmap)
$graphics.Clear([Drawing.Color]::White)
$graphics.SmoothingMode=[Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphics.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.DrawImage($meta,0,0,$width,$height)
$bitmap.Save((Join-Path $outDir ('page-'+$i+'.png')),[Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose();$bitmap.Dispose();$meta.Dispose();$stream.Dispose()
if($i%10 -eq 0){Write-Output ('Rendered page '+$i)}
}
$doc.Close(0)
Write-Output 'Native Word page rendering complete'
}finally{$word.Quit()}
