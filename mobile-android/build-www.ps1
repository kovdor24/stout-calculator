# Собирает mobile-android/www — копию сайта, которая уезжает внутрь APK.
#
# Запускать из папки mobile-android:
#     powershell -ExecutionPolicy Bypass -File .\build-www.ps1
#
# В www попадает только код и вёрстка. Фото товаров, 3D-модели и прайсы
# остаются на сайте — за них отвечает native/remote-shim.js.

$ErrorActionPreference = 'Stop'

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$src  = Split-Path -Parent $here          # корень сайта
$dst  = Join-Path $here 'www'

Write-Host "Источник: $src"
Write-Host "Назначение: $dst"
Write-Host ''

if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
New-Item -ItemType Directory -Path $dst | Out-Null

# --- Файлы приложения ------------------------------------------------------

$files = @(
    'index.html',
    'invoice.html',
    'plan_editor.html',
    'oferta.html',
    'privacy-policy.html',

    'app.js',
    'catalog.js',
    'cities_geo.js',
    'cookie-consent.js',
    'dist_prices.js',
    'el_tariffs.js',
    'gas_tariffs.js',
    'gamification.js',
    'email.min.js',
    'qrcode.min.js',
    'supabase-js.js',
    'windows-observer.js',

    'recognize.js',
    'recognize_files.js',
    'recognize_match.js',

    'boiler-3d.js',
    'project_layout.js',
    'project_nodes.js',
    'project_nodes3d.js',
    'project_node_sheets.js',
    'project_plans.js',
    'project_scheme.js',
    'project_sheets.js',
    'project_ufh_manifold.js',

    'style.css',
    'manifest.json'
)

$missing = @()
foreach ($f in $files) {
    $p = Join-Path $src $f
    if (Test-Path $p) {
        Copy-Item $p -Destination (Join-Path $dst $f)
    } else {
        $missing += $f
    }
}

if ($missing.Count -gt 0) {
    Write-Host "ВНИМАНИЕ: не найдены файлы:" -ForegroundColor Yellow
    $missing | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
}

# --- Папки целиком ---------------------------------------------------------

foreach ($d in @('fonts', 'vendor')) {
    $p = Join-Path $src $d
    if (Test-Path $p) { Copy-Item $p -Destination $dst -Recurse }
}

# --- Мелкая графика интерфейса --------------------------------------------
# Логотипы, иконки, значки оплаты — то, на что есть прямые ссылки в коде.
# Фото товаров (img/<артикул>.jpg) НЕ копируем, их подставит remote-shim.

$imgDst = Join-Path $dst 'img'
New-Item -ItemType Directory -Path $imgDst | Out-Null

$codeFiles = Get-ChildItem -Path $src -File |
             Where-Object { $_.Extension -in '.js', '.html', '.json', '.css' }

$imgRefs = @{}
foreach ($cf in $codeFiles) {
    $text = Get-Content $cf.FullName -Raw -Encoding UTF8
    foreach ($m in [regex]::Matches($text, 'img/[A-Za-z0-9_.,()+%-]+\.(?:jpg|jpeg|png|webp|svg|gif|ico)')) {
        $imgRefs[$m.Value] = $true
    }
}

$imgCopied = 0
foreach ($rel in $imgRefs.Keys) {
    $p = Join-Path $src $rel
    if (Test-Path $p) {
        Copy-Item $p -Destination (Join-Path $dst $rel)
        $imgCopied++
    }
}

# --- Прослойка для удалённых ресурсов --------------------------------------

Copy-Item (Join-Path (Join-Path $here 'native') 'remote-shim.js') -Destination (Join-Path $dst 'remote-shim.js')

$indexPath = Join-Path $dst 'index.html'
$html = [System.IO.File]::ReadAllText($indexPath, [System.Text.UTF8Encoding]::new($false))

if ($html -notmatch 'remote-shim\.js') {
    $anchor = '<link rel="icon"'
    if ($html -notmatch [regex]::Escape($anchor)) {
        throw "Не найдено место для вставки remote-shim.js в index.html (искали '$anchor'). Вёрстка изменилась — поправьте build-www.ps1."
    }
    $html = $html -replace [regex]::Escape($anchor), "<script src=`"remote-shim.js`"></script>`r`n    $anchor"
    [System.IO.File]::WriteAllText($indexPath, $html, [System.Text.UTF8Encoding]::new($false))
}

# --- Итог ------------------------------------------------------------------

$size = (Get-ChildItem $dst -Recurse -File | Measure-Object -Property Length -Sum).Sum
$count = (Get-ChildItem $dst -Recurse -File | Measure-Object).Count

Write-Host ''
Write-Host "Скопировано картинок интерфейса: $imgCopied" -ForegroundColor Green
Write-Host "Всего файлов в www: $count" -ForegroundColor Green
Write-Host ("Размер www: {0:N1} МБ" -f ($size / 1MB)) -ForegroundColor Green
