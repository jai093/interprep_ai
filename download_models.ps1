$base = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
$outDir = 'public/weights'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$files = @(
    'tiny_face_detector_model-weights_manifest.json',
    'tiny_face_detector_model-shard1',
    'face_expression_model-weights_manifest.json',
    'face_expression_model-shard1'
)

foreach ($file in $files) {
    $url = "$base/$file"
    $out = "$outDir/$file"
    Write-Host "Downloading $file..."
    Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing
    Write-Host "Done: $file ($(((Get-Item $out).Length / 1KB).ToString('N1')) KB)"
}

Write-Host "All models downloaded!"
