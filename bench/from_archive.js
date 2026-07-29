/**
 * Пополнение стенда из архива распознаваний.
 *
 * На Beget в archive/ГГГГ-ММ-ДД/ лежат json-ы применённых смет: строка как её
 * написал поставщик, плюс разобранные тип, диаметр и резьба — ровно то, что
 * получает подбор. Папка закрыта .htaccess, поэтому файлы выкачиваются руками
 * через файловый менеджер и кладутся в любую папку, а этот скрипт превращает
 * их в строки стенда.
 *
 * Запуск:
 *   node bench/from_archive.js путь/к/папке/с/json > bench/new_lines.json
 *
 * Эталон (`expect`) НЕ проставляется: то, что подбор выбрал тогда, — это его
 * ответ, а не верный. Новые строки приходят без него, и разметить их должен
 * человек. Поле `was` оставлено как подсказка разметчику.
 *
 * Строки-дубли и строки без текста отбрасываются: стенд должен быть набором
 * разных случаев, а не срезом того, что чаще возят.
 */

const fs = require('fs');
const path = require('path');

const DIR = process.argv[2];
if (!DIR) {
  console.error('Укажите папку с json-ами архива: node bench/from_archive.js ./выгрузка');
  process.exit(1);
}

/**
 * Обход с заходом в подпапки: архив разложен по дням
 * (archive/2026-07-29/212921_admin.json), и выгрузка приезжает целой веткой,
 * а не плоским списком.
 */
function collect(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) collect(full, out);
    else if (e.name.toLowerCase().endsWith('.json')) out.push(full);
  }
  return out;
}

const files = collect(DIR);
if (!files.length) {
  console.error('В папке и её подпапках нет json-файлов.');
  process.exit(1);
}

const seen = new Set();
const out = [];
let skippedFiles = 0;

for (const f of files) {
  // limits.json и access.json лежат в корне архива и сметами не являются.
  if (/^(limits|access)\.json$/i.test(path.basename(f))) continue;
  let data;
  try {
    data = JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch (e) {
    skippedFiles++;
    continue;
  }
  const rows = Array.isArray(data && data.result) ? data.result : null;
  if (!rows) { skippedFiles++; continue; }

  for (const r of rows) {
    const raw = String(r.raw || '').trim();
    if (raw.length < 4) continue;
    const key = raw.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) continue;
    seen.add(key);

    const line = { raw };
    if (r.type) line.type = r.type;
    if (r.d != null && r.d !== '') line.d = r.d;
    if (r.thread) line.thread = r.thread;
    if (r.threadType) line.threadType = r.threadType;
    // Ответ прежнего подбора — подсказка разметчику, не эталон.
    if (r.matched && r.matched.id) line.was = String(r.matched.id) + ' · ' + r.matched.name;
    out.push(line);
  }
}

console.error(`файлов ${files.length}, разобрано ${files.length - skippedFiles}, строк ${out.length}`);
process.stdout.write(JSON.stringify(out, null, 2) + '\n');
