$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$releaseRoot = Join-Path $projectRoot "release"
$appName = "DeltaAccountManager"
$packageDir = Join-Path $releaseRoot "$appName-win-x64"
$resourcesApp = Join-Path $packageDir "resources\app"
$zipPath = Join-Path $releaseRoot "$appName-win-x64.zip"

Push-Location $projectRoot
try {
  npm run build

  if (Test-Path $packageDir) {
    $resolvedPackageDir = (Resolve-Path $packageDir).Path
    if (-not $resolvedPackageDir.StartsWith($projectRoot.Path, [System.StringComparison]::OrdinalIgnoreCase)) {
      throw "Refusing to remove outside project: $resolvedPackageDir"
    }
    Remove-Item -LiteralPath $resolvedPackageDir -Recurse -Force
  }

  if (Test-Path $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
  }

  New-Item -ItemType Directory -Force -Path $packageDir, $resourcesApp | Out-Null

  Copy-Item -Path ".\node_modules\electron\dist\*" -Destination $packageDir -Recurse -Force
  Move-Item -LiteralPath (Join-Path $packageDir "electron.exe") -Destination (Join-Path $packageDir "$appName.exe") -Force

  Copy-Item -Path ".\dist" -Destination $resourcesApp -Recurse -Force
  Copy-Item -Path ".\build" -Destination $resourcesApp -Recurse -Force
  Copy-Item -Path ".\node_modules" -Destination $resourcesApp -Recurse -Force

  $appPackage = @{
    name = "delta-account-manager"
    version = "0.1.0"
    main = "dist/main/main/main.js"
  } | ConvertTo-Json -Depth 3
  Set-Content -LiteralPath (Join-Path $resourcesApp "package.json") -Value $appPackage -Encoding UTF8

  Compress-Archive -Path (Join-Path $packageDir "*") -DestinationPath $zipPath -Force

  Write-Host "Created folder: $packageDir"
  Write-Host "Created zip: $zipPath"
}
finally {
  Pop-Location
}
