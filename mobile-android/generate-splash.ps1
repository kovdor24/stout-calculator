Add-Type -AssemblyName System.Drawing

# Рисует заставку приложения — ту картинку, которую Android показывает, пока
# приложение запускается. По умолчанию Capacitor кладёт туда СВОЙ логотип, и
# это первое, что видит проверяющий в магазине: стандартная обёртка.
#
# Запускать из папки mobile-android:
#     powershell -ExecutionPolicy Bypass -File .\generate-splash.ps1

$ErrorActionPreference = 'Stop'

$root   = Split-Path -Parent $MyInvocation.MyCommand.Path
$src    = Join-Path $root '..\img\favicon.png'
$resDir = Join-Path $root 'android\app\src\main\res'

# Белый фон совпадает с background_color в manifest.json и с цветом заставки в
# теме (colors.xml → splashBackground). Иначе на стыке заставки и первого экрана
# будет заметная вспышка другого цвета.
$bg = [System.Drawing.Color]::White

# Ширина, высота и папка. Набор повторяет тот, что создаёт Capacitor.
$targets = @(
    @{ dir = 'drawable';                w = 480;  h = 320  },
    @{ dir = 'drawable-port-mdpi';      w = 320;  h = 480  },
    @{ dir = 'drawable-port-hdpi';      w = 480;  h = 800  },
    @{ dir = 'drawable-port-xhdpi';     w = 720;  h = 1280 },
    @{ dir = 'drawable-port-xxhdpi';    w = 960;  h = 1600 },
    @{ dir = 'drawable-port-xxxhdpi';   w = 1280; h = 1920 },
    @{ dir = 'drawable-land-mdpi';      w = 480;  h = 320  },
    @{ dir = 'drawable-land-hdpi';      w = 800;  h = 480  },
    @{ dir = 'drawable-land-xhdpi';     w = 1280; h = 720  },
    @{ dir = 'drawable-land-xxhdpi';    w = 1600; h = 960  },
    @{ dir = 'drawable-land-xxxhdpi';   w = 1920; h = 1280 }
)

$logo = [System.Drawing.Image]::FromFile((Resolve-Path $src).Path)

foreach ($t in $targets) {
    $canvas = New-Object System.Drawing.Bitmap $t.w, $t.h
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $brush = New-Object System.Drawing.SolidBrush $bg
    $g.FillRectangle($brush, 0, 0, $t.w, $t.h)
    $brush.Dispose()

    # Знак занимает четверть меньшей стороны — так он одинаково смотрится и на
    # узком телефоне, и на планшете в альбомной ориентации.
    $side = [Math]::Min($t.w, $t.h)
    $size = [int]([Math]::Round($side * 0.25))
    $x = [int]([Math]::Round(($t.w - $size) / 2))
    $y = [int]([Math]::Round(($t.h - $size) / 2))
    $g.DrawImage($logo, $x, $y, $size, $size)

    $g.Dispose()

    $out = Join-Path (Join-Path $resDir $t.dir) 'splash.png'
    $canvas.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $canvas.Dispose()

    Write-Host ("{0}: {1}x{2}" -f $t.dir, $t.w, $t.h)
}

$logo.Dispose()
Write-Host 'Заставка перерисована.' -ForegroundColor Green
