$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

New-Item -ItemType Directory -Force -Path 'assets/images', 'assets/sounds' | Out-Null

Add-Type -AssemblyName System.Drawing

function Save-Png {
  param([string]$Path, [int]$Size, [int]$R, [int]$G, [int]$B)
  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $graphics = [System.Drawing.Graphics]::FromImage($bmp)
  $graphics.Clear([System.Drawing.Color]::FromArgb($R, $G, $B))
  $graphics.Dispose()
  $fullPath = Join-Path $root $Path
  $bmp.Save($fullPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

Save-Png -Path 'assets/images/icon.png' -Size 1024 -R 32 -G 138 -B 239
Save-Png -Path 'assets/images/favicon.png' -Size 48 -R 32 -G 138 -B 239
Save-Png -Path 'assets/images/splash-icon.png' -Size 200 -R 255 -G 255 -B 255
Save-Png -Path 'assets/images/android-icon-foreground.png' -Size 1024 -R 32 -G 138 -B 239
Save-Png -Path 'assets/images/android-icon-background.png' -Size 1024 -R 230 -G 244 -B 254
Save-Png -Path 'assets/images/android-icon-monochrome.png' -Size 1024 -R 0 -G 0 -B 0

Write-Host 'Created placeholder PNG assets in assets/images'
