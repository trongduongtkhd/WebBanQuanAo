$ErrorActionPreference='Stop'
$taskDir=$PSScriptRoot
$reportPath=Join-Path (Split-Path (Split-Path $taskDir)) 'src\Docs\BaoCaoDoAn3_CapNhat_SoDoTuanTu_2_2_1.docx'
$pdfPath=Join-Path $taskDir 'review.pdf'
$word=New-Object -ComObject Word.Application
$word.Visible=$true
$word.DisplayAlerts=0
Write-Output 'Word instance ready'
try{
$document=$word.Documents.Open($reportPath,$false,$false)
Write-Output 'Document opened'
$document.Repaginate()
Write-Output 'Pagination completed'
# Refresh the page numbers in existing tables of contents without changing their entries.
foreach($toc in $document.TablesOfContents){$toc.UpdatePageNumbers()}
$document.Save()
Write-Output 'Document saved; exporting PDF'
$document.ExportAsFixedFormat($pdfPath,17,$false,0,0,1,1,0,$true,$false,0,$true,$false,$false)
$pages=$document.ComputeStatistics(2)
Write-Output ('Exported '+$pages+' pages to '+$pdfPath)
$document.Close(0)
}finally{$word.Quit()}
