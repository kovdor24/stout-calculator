// Сборка справочника гарантийных сроков из паспортов STOUT и ROMMER.
//
// Запускать вручную, когда обновилась выгрузка паспортов:
//   node warranty_build.js
//
// Паспорта лежат не в этом репозитории, а в рабочей папке аудита:
//   !Работа/6. КАЛЬКУЛЯТОР/Аудит паспортов STOUT-ROMMER/02_текст/*.txt
// (411 файлов, разобранных из PDF при аудите техдокументации 21.08.2026).
// Путь можно передать первым аргументом.
//
// На выходе — warranty.js со справочником для документов монтажника.
//
// Почему три уровня, а не один: артикул в паспорте есть не всегда, а линейки
// обновляются (у шаровых кранов STOUT суффикс сменился с -0000NN на -2000NN при
// переходе на ГОСТ, и прямое совпадение по артикулу для них перестало работать).
// Уровень группы (первые буквы артикула) сознательно НЕ используем: внутри одной
// группы сроки расходятся втрое — у RDG встречаются и 12, и 24, и 60 месяцев.
// Лучше честное «по паспорту изготовителя», чем красивое, но выдуманное число.

const fs = require('fs');
const path = require('path');

const TXT_DIR = process.argv[2]
    || 'C:/Users/d.ibatullin/Yandex.Disk/!Работа/6. КАЛЬКУЛЯТОР/Аудит паспортов STOUT-ROMMER/02_текст';
const OUT = path.join(__dirname, 'warranty.js');
const CATALOG = path.join(__dirname, 'catalog.js');

const RE_ART = /\b[A-ZА-Я]{2,4}-\d{4}-[\dA-Z]{4,8}\b/g;

// Срок из текста паспорта. Порядок правил важен: сначала ищем срок эксплуатации
// (службы), и только если его нет — общую формулировку. Отдельно стоящий
// «гарантийный срок хранения» не берём вовсе: это срок лежания на складе, а не
// обязательство перед хозяином дома, и подставлять его в талон нельзя.
function grabWarranty(text) {
    const t = text.replace(/\u00AD/g, '');   // мягкие переносы из PDF
    const num = (m) => {
        const n = parseInt(m[1], 10);
        const months = /мес/i.test(m[2]) ? n : n * 12;
        return (months > 0 && months <= 600) ? months : null;
    };
    const rules = [
        /гарантийный\s+срок\s+(?:эксплуатации|службы)[^.\n]{0,80}?(\d{1,3})\s*(лет|год[а]?|месяц[аев]*)/i,
        /гарантийный\s+срок(?!\s+хранения)[^.\n]{0,60}?составляет\s+(\d{1,3})\s*(лет|год[а]?|месяц[аев]*)/i,
        /гарантийный\s+срок(?!\s+хранения)[^.\n]{0,40}?[-–—]\s*(\d{1,3})\s*(лет|год[а]?|месяц[аев]*)/i,
        /гарантийный\s+срок(?!\s+хранения)[^.\n]{0,80}?(\d{1,3})\s*(лет|год[а]?|месяц[аев]*)/i
    ];
    for (const r of rules) {
        const m = t.match(r);
        if (m) { const v = num(m); if (v) return v; }
    }
    return null;
}

const files = fs.readdirSync(TXT_DIR).filter(f => f.endsWith('.txt'));
const byArticle = {};
const familyVotes = {};
let withTerm = 0;

files.forEach(f => {
    const text = fs.readFileSync(path.join(TXT_DIR, f), 'utf8');
    const months = grabWarranty(text);
    if (!months) return;
    withTerm++;
    const arts = [...new Set(text.match(RE_ART) || [])];
    arts.forEach(a => {
        byArticle[a] = months;
        const fam = a.split('-').slice(0, 2).join('-');
        (familyVotes[fam] = familyVotes[fam] || {})[months] = (familyVotes[fam][months] || 0) + 1;
    });
});

// Семейство берём только когда оно однозначно: разные сроки внутри одного
// семейства означают, что паспорта описывают разные изделия, и угадывать нельзя.
const byFamily = {};
let ambiguous = 0;
Object.entries(familyVotes).forEach(([fam, votes]) => {
    const kinds = Object.keys(votes);
    if (kinds.length === 1) byFamily[fam] = parseInt(kinds[0], 10);
    else ambiguous++;
});

// В файл кладём только то, что может пригодиться: артикулы из каталога и все
// однозначные семейства. Иначе справочник раздувается вчетверо ради позиций,
// которых в сметах не бывает.
const catalog = fs.readFileSync(CATALOG, 'utf8');
const catArts = new Set(catalog.match(RE_ART) || []);
const slimArticles = {};
Object.entries(byArticle).forEach(([a, m]) => { if (catArts.has(a)) slimArticles[a] = m; });

let exact = 0, fam = 0, none = 0;
catArts.forEach(a => {
    if (slimArticles[a] !== undefined) exact++;
    else if (byFamily[a.split('-').slice(0, 2).join('-')] !== undefined) fam++;
    else none++;
});

const today = new Date().toISOString().slice(0, 10);
const out = `// Гарантийные сроки изготовителей, месяцев. Собрано из ${files.length} паспортов
// STOUT и ROMMER скриптом warranty_build.js — руками не править,
// правка потеряется при следующей пересборке.
//
// Обновлено: ${today}
// Со сроком в паспорте: ${withTerm} из ${files.length}
// Позиций каталога: точно по артикулу ${exact}, по семейству ${fam}, без срока ${none}
// Семейств отброшено из-за расхождения сроков: ${ambiguous}
//
// Чего здесь нет и почему: срок по коду группы (первые буквы артикула). Внутри
// группы сроки расходятся втрое, и подставлять большинство — значит обещать
// клиенту то, чего изготовитель не обещал.
const WARRANTY_DB = {
    updated: '${today}',
    byArticle: ${JSON.stringify(slimArticles, null, 0).replace(/","/g, '",\n        "').replace(/^\{/, '{\n        ').replace(/\}$/, '\n    }')},
    byFamily: ${JSON.stringify(byFamily, null, 0).replace(/","/g, '",\n        "').replace(/^\{/, '{\n        ').replace(/\}$/, '\n    }')}
};
`;
fs.writeFileSync(OUT, out);
console.log('паспортов: ' + files.length + ', со сроком: ' + withTerm);
console.log('в справочнике: артикулов ' + Object.keys(slimArticles).length + ', семейств ' + Object.keys(byFamily).length);
console.log('покрытие каталога: точно ' + exact + ', по семейству ' + fam + ', без срока ' + none);
console.log('записано: ' + OUT);
