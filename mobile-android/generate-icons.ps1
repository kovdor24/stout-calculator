Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = Join-Path $root "..\img\favicon.png"
$resDir = Join-Path $root "android\app\src\main\res"
$storeDir = Join-Path $root "store-assets"

if (-not (Test-Path $storeDir)) { New-Item -ItemType Directory -Path $storeDir | Out-Null }

function New-IconCanvas {
    param(
        [string]$SourcePath,
        [int]$CanvasSize,
        [double]$IconScale,
        [System.Drawing.Color]$BackgroundColor,
        [string]$OutPath
    )
    $src = [System.Drawing.Image]::FromFile($SourcePath)
    $canvas = New-Object System.Drawing.Bitmap $CanvasSize, $CanvasSize
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ($BackgroundColor.A -gt 0) {
        $brush = New-Object System.Drawing.SolidBrush $BackgroundColor
        $g.FillRectangle($brush, 0, 0, $CanvasSize, $CanvasSize)
        $brush.Dispose()
    }

    $iconSize = [int]([Math]::Round($CanvasSize * $IconScale))
    $offset = [int]([Math]::Round(($CanvasSize - $iconSize) / 2))
    $g.DrawImage($src, $offset, $offset, $iconSize, $iconSize)

    $g.Dispose()
    $src.Dispose()
    $canvas.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $canvas.Dispose()
}

$transparent = [System.Drawing.Color]::FromArgb(0, 255, 255, 255)
$white = [System.Drawing.Color]::White

# density -> (legacy/round size, adaptive foreground size)
$densities = @{
    "mdpi"    = @{ legacy = 48;  fg = 108 }
    "hdpi"    = @{ legacy = 72;  fg = 162 }
    "xhdpi"   = @{ legacy = 96;  fg = 216 }
    "xxhdpi"  = @{ legacy = 144; fg = 324 }
    "xxxhdpi" = @{ legacy = 192; fg = 432 }
}

foreach ($d in $densities.Keys) {
    $sizes = $densities[$d]
    $dir = Join-Path $resDir "mipmap-$d"

    # Legacy square icon: white bg, logo at 78%
    New-IconCanvas -SourcePath $src -CanvasSize $sizes.legacy -IconScale 0.78 -BackgroundColor $white -OutPath (Join-Path $dir "ic_launcher.png")
    # Legacy round icon: same content (round mask applied by launcher), logo slightly smaller to avoid clipping
    New-IconCanvas -SourcePath $src -CanvasSize $sizes.legacy -IconScale 0.70 -BackgroundColor $white -OutPath (Join-Path $dir "ic_launcher_round.png")
    # Adaptive icon foreground: transparent bg, logo within safe zone (~62%)
    New-IconCanvas -SourcePath $src -CanvasSize $sizes.fg -IconScale 0.62 -BackgroundColor $transparent -OutPath (Join-Path $dir "ic_launcher_foreground.png")

    Write-Host "Generated icons for $d"
}

# Store listing icon (Play Console / RuStore Console): 512x512, opaque white background
New-IconCanvas -SourcePath $src -CanvasSize 512 -IconScale 0.80 -BackgroundColor $white -OutPath (Join-Path $storeDir "icon-512.png")
Write-Host "Generated store-assets/icon-512.png"
