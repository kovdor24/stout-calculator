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
    'push.js',
    'email.min.js',
    'qrcode.min.js',
    'supabase-js.js',
    'windows-observer.js',

    'recognize.js',
    'recognize_files.js',
    'recognize_match.js',
    'recognize_plan.js',

    # Эти шесть подключены в index.html, но в список не попадали — внутри
    # приложения их просто не было. Без них молча отваливались обучение,
    # договоры с актами, выгрузка в Excel, сверка цен и гарантийный талон:
    # человек нажимал кнопку, и ничего не происходило.
    'tour.js',
    'docs.js',
    'excel_export.js',
    'reprice.js',
    'warranty.js',

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

# --- Библиотеки со стороннего сервера ---------------------------------------
# Печать в PDF и проверка пароля подключены с cdnjs.cloudflare.com. На сайте это
# нормально, а в приложении означает, что без интернета не работает даже печать
# уже посчитанной сметы. Кладём библиотеки внутрь и переписываем ссылки.

$vendorDst = Join-Path $dst 'vendor'
if (-not (Test-Path $vendorDst)) { New-Item -ItemType Directory -Path $vendorDst | Out-Null }

$cdnLibs = @(
    @{ url = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'; file = 'html2pdf.bundle.min.js' },
    @{ url = 'https://cdnjs.cloudflare.com/ajax/libs/bcryptjs/2.4.3/bcrypt.min.js';              file = 'bcrypt.min.js' }
)

$vendored = @{}
foreach ($lib in $cdnLibs) {
    $out = Join-Path $vendorDst $lib.file
    try {
        Invoke-WebRequest -Uri $lib.url -OutFile $out -UseBasicParsing -TimeoutSec 60
        $vendored[$lib.url] = "vendor/$($lib.file)"
        Write-Host "Забрана библиотека: $($lib.file)" -ForegroundColor Green
    } catch {
        # Не валим сборку: приложение останется рабочим, просто печать в PDF
        # будет требовать сети, как сейчас.
        Write-Host "ВНИМАНИЕ: не удалось скачать $($lib.url) — ссылка осталась внешней." -ForegroundColor Yellow
    }
}

# --- Прослойки для приложения ----------------------------------------------
# remote-shim.js — подставляет адрес сайта тому, что внутрь не влезло.
# native-ui.js   — убирает следы сайта и добавляет поведение приложения.

foreach ($shim in @('remote-shim.js', 'native-ui.js')) {
    Copy-Item (Join-Path (Join-Path $here 'native') $shim) -Destination (Join-Path $dst $shim)
}

# Подключаем на КАЖДОЙ странице приложения, а не только на главной: оферту и
# политику человек открывает прямо в приложении, и там тоже не должно быть ни
# вопроса про cookie, ни неработающей кнопки «Назад».
#
# native-ui.js идёт первым и без defer: он ставит метку window.__HC_NATIVE__,
# по которой cookie-consent.js понимает, что баннер показывать не надо.
# Отложенный скрипт выполнился бы уже после него.

$injected = 0
foreach ($page in @('index.html', 'invoice.html', 'plan_editor.html', 'oferta.html', 'privacy-policy.html')) {
    $p = Join-Path $dst $page
    if (-not (Test-Path $p)) { continue }

    $html = [System.IO.File]::ReadAllText($p, [System.Text.UTF8Encoding]::new($false))
    if ($html -match 'native-ui\.js') { continue }

    $tags = "`r`n    <script src=`"native-ui.js`"></script>`r`n    <script src=`"remote-shim.js`"></script>"

    # Встаём сразу после объявления кодировки, если оно есть: браузер ищет его в
    # первом килобайте разметки, и скрипт, вставленный выше, мог бы его туда не
    # пустить — страница открылась бы кракозябрами.
    $charset = [regex]::Match($html, '<meta\s+charset[^>]*>', 'IgnoreCase')
    if ($charset.Success) {
        $html = $html.Insert($charset.Index + $charset.Length, $tags)
    } else {
        $head = [regex]::Match($html, '<head[^>]*>', 'IgnoreCase')
        if (-not $head.Success) {
            throw "В $page нет <head> — вставить прослойки некуда. Вёрстка изменилась, поправьте build-www.ps1."
        }
        $html = $html.Insert($head.Index + $head.Length, $tags)
    }

    [System.IO.File]::WriteAllText($p, $html, [System.Text.UTF8Encoding]::new($false))
    $injected++
}

if ($injected -eq 0) {
    throw "Прослойки приложения не подключились ни к одной странице — проверьте build-www.ps1."
}

# Ссылки на скачанные библиотеки переписываем во всех страницах приложения.
if ($vendored.Count -gt 0) {
    foreach ($page in @('index.html', 'invoice.html', 'plan_editor.html')) {
        $p = Join-Path $dst $page
        if (-not (Test-Path $p)) { continue }

        $text = [System.IO.File]::ReadAllText($p, [System.Text.UTF8Encoding]::new($false))
        $changed = $false
        foreach ($url in $vendored.Keys) {
            if ($text.Contains($url)) {
                $text = $text.Replace($url, $vendored[$url])
                $changed = $true
            }
        }
        if ($changed) {
            [System.IO.File]::WriteAllText($p, $text, [System.Text.UTF8Encoding]::new($false))
            Write-Host "Ссылки на библиотеки переписаны: $page" -ForegroundColor Green
        }
    }
}

# --- Итог ------------------------------------------------------------------

$size = (Get-ChildItem $dst -Recurse -File | Measure-Object -Property Length -Sum).Sum
$count = (Get-ChildItem $dst -Recurse -File | Measure-Object).Count

Write-Host ''
Write-Host "Скопировано картинок интерфейса: $imgCopied" -ForegroundColor Green
Write-Host "Всего файлов в www: $count" -ForegroundColor Green
Write-Host ("Размер www: {0:N1} МБ" -f ($size / 1MB)) -ForegroundColor Green
