const fs = require('fs');
const filepath = "c:\\Users\\d.ibatullin\\Yandex.Disk\\!Работа\\6. КАЛЬКУЛЯТОР\\Otoplenie_Calc\\Редакция\\stout & rommer\\app.js";

const content = fs.readFileSync(filepath, 'utf-8');
const lines = content.split('\n');

lines.forEach((line, i) => {
    if (line.includes("updateDocumentTitle: function") || (line.includes("updateDocumentTitle") && line.includes("function"))) {
        const start = Math.max(0, i - 2);
        const end = Math.min(lines.length, i + 35);
        console.log(`--- Lines ${start+1} to ${end+1} ---`);
        for (let j = start; j < end; j++) {
            console.log(`${j+1}: ${lines[j].trim()}`);
        }
    }
});
