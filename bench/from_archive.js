/**
 * Пополнение стенда из архива распознаваний.
 *
 * На Beget в archive/ГГГГ-ММ-ДД/ лежат json-ы применённых смет: строка как её
 * написал поставщик, плюс разобранные тип, диаметр и резьба — ровно то, что
 * получает подбор. Папка закрыта .htaccess, поэтому файлы выкачиваются руками
 * через файловый менеджер и кладутся в любую папку, а этот скрипт превращает
 * их в строки стенда.
 *
 * ЭТАЛОН ИЗ РУЧНЫХ ЗАМЕН. Раньше `expect` не проставлялся ни у одной строки:
 * то, что подбор выбрал тогда, — это его ответ, а не верный, и отличить его
 * от решения человека архив не позволял. Теперь в записи есть пометка на
 * строке: `manual` — монтажник выбрал артикул сам, через поиск по каталогу;
 * `fromMem` — подставилось его же решение с прошлой сметы. И то и другое —
 * размеченный человеком эталон, причём самый ценный: ручная замена случается
 * ровно там, где автоподбор промахнулся. Такие строки уезжают в стенд с
 * готовым `expect`, остальные — без него, размечать руками.
 *
 * Запуск:
 *   node bench/from_archive.js путь/к/папке > bench/new_lines.json
 *   node bench/from_archive.js путь/к/папке --merge bench/lines.json > out.json
 *
 * --merge дописывает к существующему набору только НОВЫЕ строки: разметку,
 * сделанную руками, скрипт не трогает и не перетирает. Если ручная замена
 * противоречит проставленному эталону, он говорит об этом, но решает человек.
 *
 * Строки-дубли и строки без текста отбрасываются: стенд должен быть набором
 * разных случаев, а не срезом того, что чаще возят.
 */

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const DIR = argv.find((a) => !a.startsWith('--'));
const mergeAt = argv.indexOf('--merge');
const MERGE_FILE = mergeAt >= 0 ? argv[mergeAt + 1] : null;

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

/**
 * Чей это ответ. Чем больше число, тем весомее: свежий выбор человека бьёт
 * его же прошлое решение, а любое решение человека бьёт автоподбор.
 *
 * Это важно именно при дедупликации: одна и та же строка встречается в
 * десятке смет, и раньше побеждала та, что попалась первой. Если первой шла
 * авторазобранная, ручная замена по тому же тексту терялась — то есть
 * терялось ровно то, ради чего архив и разбирают.
 */
const WEIGHT = { manual: 3, memory: 2, auto: 1 };

function sourceOf(r) {
  if (r.manual) return 'manual';
  if (r.fromMem) return 'memory';
  return 'auto';
}

const best = new Map();   // ключ строки → лучшая на данный момент запись
let skippedFiles = 0;
let seenRows = 0;

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
    seenRows++;

    const key = raw.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ');
    const src = sourceOf(r);
    const prev = best.get(key);
    if (prev && WEIGHT[prev.src] >= WEIGHT[src]) continue;

    const line = { raw };
    if (r.type) line.type = r.type;
    if (r.d != null && r.d !== '') line.d = r.d;
    if (r.thread) line.thread = r.thread;
    if (r.threadType) line.threadType = r.threadType;

    const art = r.matched && r.matched.id != null ? String(r.matched.id) : null;
    if (src === 'auto') {
      // Ответ прежнего подбора — подсказка разметчику, не эталон.
      if (art) line.was = art + ' · ' + (r.matched.name || '');
    } else if (art) {
      line.expect = art;
      line.why = src === 'manual'
        ? 'выбрано монтажником вручную в разборе сметы'
        : 'подставлено из памяти замен монтажника';
    }
    line.src = src;
    best.set(key, { src, line });
  }
}

// Счёт по АРХИВУ снимаем до слияния: после него в наборе останутся только
// те строки, которых там ещё не было, и цифра «ручных замен» превратилась бы
// в «ручных замен, оказавшихся новыми» — а это совсем другая величина.
const fromArchive = [...best.values()];
const archManual = fromArchive.filter((v) => v.src === 'manual').length;
const archMemory = fromArchive.filter((v) => v.src === 'memory').length;

let out = fromArchive.map((v) => v.line);

// ---------------------------------------------------------------------------
// Слияние с существующим набором
// ---------------------------------------------------------------------------

let added = 0, kept = 0;
const conflicts = [];

if (MERGE_FILE) {
  let old = [];
  try {
    old = JSON.parse(fs.readFileSync(MERGE_FILE, 'utf8'));
  } catch (e) {
    console.error(`Не прочитать ${MERGE_FILE}: ${e.message}`);
    process.exit(1);
  }

  const keyOf = (l) => String(l.raw || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
  const have = new Map(old.map((l) => [keyOf(l), l]));
  const fresh = [];

  for (const line of out) {
    const k = keyOf(line);
    const prev = have.get(k);
    if (!prev) { fresh.push(line); added++; continue; }
    kept++;
    // Разметку человека не трогаем. Но если ручная замена расходится с
    // проставленным эталоном, об этом надо сказать: либо эталон устарел,
    // либо монтажник ошибся, и разобраться должен человек.
    if (line.expect && prev.expect !== undefined) {
      const a = String(line.expect).replace(/^[-\s]+|[-\s]+$/g, '');
      const b = prev.expect === null ? null : String(prev.expect).replace(/^[-\s]+|[-\s]+$/g, '');
      const okList = Array.isArray(prev.expect)
        ? prev.expect.map((x) => String(x).replace(/^[-\s]+|[-\s]+$/g, ''))
        : [b];
      if (!okList.includes(a)) conflicts.push({ raw: line.raw, было: prev.expect, стало: line.expect });
    }
  }
  out = old.concat(fresh);
}

// ---------------------------------------------------------------------------

const byExpect = out.filter((l) => l.expect !== undefined).length;

console.error(`файлов ${files.length}, разобрано ${files.length - skippedFiles}, строк в архиве ${seenRows}`);
console.error(`из архива уникальных ${best.size}: выбрано вручную ${archManual}, из памяти замен ${
  archMemory}, автоподбор ${best.size - archManual - archMemory}`);
if (MERGE_FILE) console.error(`слияние с ${MERGE_FILE}: добавлено ${added}, уже было ${kept}`);
console.error(`итого в наборе ${out.length}, с эталоном ${byExpect}, размечать руками ${out.length - byExpect}`);

if (conflicts.length) {
  console.error(`\nРучная замена расходится с эталоном (${conflicts.length}) — решать человеку:`);
  for (const c of conflicts.slice(0, 20)) {
    console.error(`  ${c.raw}`);
    console.error(`    в наборе: ${JSON.stringify(c.было)}   в архиве: ${c.стало}`);
  }
  if (conflicts.length > 20) console.error(`  …и ещё ${conflicts.length - 20}`);
}

if (!archManual && !archMemory) {
  console.error('\nПометок о ручном подборе нет ни на одной строке.');
  console.error('Так выглядит архив, собранный до выпуска с этой пометкой, — эталоны придётся');
  console.error('проставлять руками: node bench/run.js --todo');
}

process.stdout.write(JSON.stringify(out, null, 2) + '\n');
