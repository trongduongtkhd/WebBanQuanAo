param([int]$Start=0,[int]$Count=0)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[void][Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
[void][Windows.Data.Pdf.PdfDocument,Windows.Data.Pdf,ContentType=WindowsRuntime]
[void][Windows.Storage.Streams.InMemoryRandomAccessStream,Windows.Storage.Streams,ContentType=WindowsRuntime]
$asTask=([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {$_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'})[0]
function Await($op,$type){$task=$asTask.MakeGenericMethod($type).Invoke($null,@($op));$task.Wait();$task.Result}
function AwaitAction($op){$t=[System.WindowsRuntimeSystemExtensions]::AsTask($op);$t.Wait()}
$file=Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync((Join-Path $PSScriptRoot 'review.pdf'))) ([Windows.Storage.StorageFile])
$pdf=Await ([Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($file)) ([Windows.Data.Pdf.PdfDocument])
$out=Join-Path $PSScriptRoot 'pages';[void][IO.Directory]::CreateDirectory($out)
$end=if($Count -eq 0){$pdf.PageCount}else{[Math]::Min($pdf.PageCount,$Start+$Count)}
for($i=$Start;$i -lt $end;$i++){
$page=$pdf.GetPage($i)
$stream=New-Object Windows.Storage.Streams.InMemoryRandomAccessStream
$options=New-Object Windows.Data.Pdf.PdfPageRenderOptions
$options.DestinationWidth=[uint32]1600
AwaitAction ($page.RenderToStreamAsync($stream,$options))
$reader=[Windows.Storage.Streams.DataReader]::new($stream.GetInputStreamAt(0))
[void](Await ($reader.LoadAsync([uint32]$stream.Size)) ([uint32]))
$bytes=[byte[]]::new($stream.Size);$reader.ReadBytes($bytes)
[IO.File]::WriteAllBytes((Join-Path $out ('page-'+($i+1)+'.png')),$bytes)
$reader.Dispose();$stream.Dispose();$page.Dispose()
}
Write-Output ('Rendered pages '+($Start+1)+'–'+$end+' of '+$pdf.PageCount)
