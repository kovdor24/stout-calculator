/**
 * Стенд подбора: мера вместо «на этой смете вроде лучше».
 *
 * Зачем он нужен. Подбор состоит из четырёх механизмов и пяти таблиц частных
 * правил, и каждый разобранный промах добавляет туда ещё одну строку. Такая
 * строка чинит свой случай и с некоторой вероятностью ломает соседний — так
 * правка «предмет строки это цепочка слов», починившая котлы BAXI, заодно
 * увела настенный кронштейн радиатора в монтажную консоль. Заметить это было
 * нечем: единственной проверкой была смета, случайно оказавшаяся под рукой.
 *
 * Стенд гоняет реальные строки смет через ТОТ ЖЕ конвейер, что и сайт
 * (matchItem: замена → каталог → прайс → название), и сравнивает артикул с
 * эталоном, проставленным человеком. Дальше любую правку видно числом.
 *
 * Запуск:
 *   node bench/run.js                       прогон на текущем коде
 *   node bench/run.js --index путь.json     другой прайс-индекс
 *   node bench/run.js --compare путь/к/коду сравнить две версии кода
 *   node bench/run.js --todo                строки, которым не проставлен эталон
 *   node bench/run.js --all                 показать разбор каждой строки
 *
 * Строки лежат в bench/lines.json. Файл не публикуется (см. .gitignore): это
 * сметы монтажников, а репозиторий открытый.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Аргументы
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? (argv[i + 1] || true) : null;
};
const has = (name) => argv.includes(name);

const LINES_FILE = flag('--lines') || path.join(__dirname, 'lines.json');
const CODE_DIR = flag('--code') || ROOT;
const COMPARE_DIR = flag('--compare');
const SHOW_ALL = has('--all');
const SHOW_TODO = has('--todo');

/**
 * Индекс прайса. По умолчанию берём тот, что лежит рядом с кодом, — сайт
 * работает с ним же, когда прокси недоступен. Если он устарел, разница со
 * страницей будет не в подборе, а в наполнении базы, и это собьёт с толку.
 */
const INDEX_FILE = flag('--index') || path.join(CODE_DIR, 'price_index.json');

// ---------------------------------------------------------------------------
// Загрузка подбора
// ---------------------------------------------------------------------------

/**
 * catalog.js и recognize_match.js склеиваются в один скрипт: в браузере они
 * делят общую область видимости, и подбор ждёт `catalog` глобальным.
 */
function loadMatcher(dir) {
  const src =
    fs.readFileSync(path.join(dir, 'catalog.js'), 'utf8') + '\n;\n' +
    fs.readFileSync(path.join(dir, 'recognize_match.js'), 'utf8') + '\n;\n' +
    'globalThis.__RM = RecognizeMatch;\n';

  const sandbox = {
    console,
    document: { createElement: () => ({ style: {} }) },
    window: {},
    navigator: { userAgent: 'node' },
    localStorage: { getItem: () => null, setItem: () => {} },
    module: undefined,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: path.join(dir, 'bench-bundle.js') });
  return sandbox.__RM;
}

function withIndex(dir, indexFile) {
  const RM = loadMatcher(dir);
  const idx = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
  RM.setPriceIndex(idx.items);
  return { RM, version: idx.version, count: idx.items.length };
}

// ---------------------------------------------------------------------------
// Прогон
// ---------------------------------------------------------------------------

/** Строка стенда → тот же вид записи, что приходит от распознавания. */
function toRec(line) {
  return {
    raw: line.raw,
    type: line.type || '',
    d: line.d != null ? line.d : null,
    thread: line.thread || null,
    threadType: line.threadType || null,
  };
}

/**
 * Артикул без висячих дефисов.
 *
 * В листах BAXI и De Dietrich код приезжал с хвостом («7671757--»), и правка
 * price_update.php его снимает. Сравнивать по сырому виду нельзя: после
 * пересборки индекса эталоны покраснели бы все разом, хотя подбор не менялся.
 * Дефис по краям — мусор разбора, а не часть кода.
 */
const artKey = (a) => (a == null ? null : String(a).replace(/^[-\s]+|[-\s]+$/g, ''));

function runOne(RM, line) {
  let m = null;
  try {
    m = RM.matchItem(toRec(line));
  } catch (e) {
    return { verdict: 'ошибка', got: null, note: e.message };
  }
  const got = m ? String(m.item.id) : null;

  // Эталон не проставлен — строку считаем неразмеченной и в счёт не берём.
  if (line.expect === undefined) return { verdict: 'нет эталона', got, item: m && m.item };

  // Эталон null означает «в базе этого нет, и подбирать нечего».
  if (line.expect === null) {
    return got === null
      ? { verdict: 'точно', got, item: null }
      : { verdict: 'лишнее', got, item: m && m.item };
  }
  if (got === null) return { verdict: 'пусто', got, item: null };
  return artKey(got) === artKey(line.expect)
    ? { verdict: 'точно', got, item: m.item }
    : { verdict: 'неверно', got, item: m.item };
}

function score(RM, lines) {
  const rows = lines.map((l) => ({ line: l, res: runOne(RM, l) }));
  const marked = rows.filter((r) => r.line.expect !== undefined);
  const tally = { точно: 0, неверно: 0, пусто: 0, лишнее: 0, ошибка: 0 };
  for (const r of marked) tally[r.res.verdict] = (tally[r.res.verdict] || 0) + 1;
  return { rows, marked, tally };
}

// ---------------------------------------------------------------------------
// Вывод
// ---------------------------------------------------------------------------

const cut = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));

function report(label, res, total) {
  const n = res.marked.length;
  const pct = (x) => (n ? Math.round(100 * x / n) + '%' : '—');
  console.log(`${label}: строк ${total}, с эталоном ${n}`);
  console.log(`   точно    ${String(res.tally.точно).padStart(3)}  ${pct(res.tally.точно)}`);
  console.log(`   неверно  ${String(res.tally.неверно).padStart(3)}  ${pct(res.tally.неверно)}   подобрано не то`);
  console.log(`   пусто    ${String(res.tally.пусто).padStart(3)}  ${pct(res.tally.пусто)}   не подобрано, а надо было`);
  console.log(`   лишнее   ${String(res.tally.лишнее).padStart(3)}  ${pct(res.tally.лишнее)}   подобрано там, где в базе нечего брать`);
  if (res.tally.ошибка) console.log(`   ОШИБКА   ${res.tally.ошибка}`);
  console.log('');
}

function listProblems(res) {
  const bad = res.rows.filter((r) => ['неверно', 'пусто', 'лишнее', 'ошибка'].includes(r.res.verdict));
  if (!bad.length) return;
  console.log('--- расхождения ---');
  for (const { line, res: r } of bad) {
    console.log(`  [${r.verdict}] ${cut(line.raw, 72)}`);
    console.log(`      надо:  ${line.expect === null ? '(ничего)' : line.expect}`);
    console.log(`      вышло: ${r.got || '(ничего)'}${r.item ? '  ' + cut(r.item.name, 60) + '  ' + r.item.price + ' ₽' : ''}`);
  }
  console.log('');
}

// ---------------------------------------------------------------------------

const lines = JSON.parse(fs.readFileSync(LINES_FILE, 'utf8'));

if (SHOW_TODO) {
  const todo = lines.filter((l) => l.expect === undefined);
  console.log(`Без эталона: ${todo.length} из ${lines.length}\n`);
  todo.forEach((l, i) => {
    console.log(`${String(i + 1).padStart(3)}. ${l.raw}`);
    if (l.hint) console.log(`     кандидаты: ${l.hint}`);
  });
  process.exit(0);
}

const main = withIndex(CODE_DIR, INDEX_FILE);
console.log(`прайс ${main.version}, ${main.count} позиций  (${path.relative(ROOT, INDEX_FILE) || INDEX_FILE})`);
console.log(`код: ${CODE_DIR === ROOT ? 'текущий' : CODE_DIR}\n`);

const res = score(main.RM, lines);
report('ИТОГ', res, lines.length);

if (COMPARE_DIR) {
  const other = withIndex(COMPARE_DIR, INDEX_FILE);
  const resOther = score(other.RM, lines);
  report('для сравнения (' + COMPARE_DIR + ')', resOther, lines.length);

  console.log('--- что изменилось между версиями ---');
  let n = 0;
  res.rows.forEach((r, i) => {
    const o = resOther.rows[i];
    if (r.res.got === o.res.got) return;
    n++;
    console.log(`  ${cut(r.line.raw, 70)}`);
    console.log(`      было:  ${o.res.got || '(ничего)'}  [${o.res.verdict}]`);
    console.log(`      стало: ${r.res.got || '(ничего)'}  [${r.res.verdict}]`);
  });
  if (!n) console.log('  (ничего)');
  console.log('');
}

if (SHOW_ALL) {
  console.log('--- все строки ---');
  for (const { line, res: r } of res.rows) {
    console.log(`  [${r.verdict}] ${cut(line.raw, 66)}`);
    console.log(`      ${r.got || '(ничего)'}${r.item ? '  ' + cut(r.item.name, 58) : ''}`);
  }
  console.log('');
}

listProblems(res);

const todo = lines.filter((l) => l.expect === undefined).length;
if (todo) console.log(`Без эталона ещё ${todo} строк — «node bench/run.js --todo» покажет какие.`);
