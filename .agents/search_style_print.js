const fs = require('fs');
const filepath = "c:\\Users\\d.ibatullin\\Yandex.Disk\\!Работа\\6. КАЛЬКУЛЯТОР\\Otoplenie_Calc\\Редакция\\stout & rommer\\style.css";

const content = fs.readFileSync(filepath, 'utf-8');
const lines = content.split('\n');

lines.forEach((line, i) => {
    if (line.includes("@media print")) {
        const start = Math.max(0, i - 5);
        const end = Math.min(lines.length, i + 40);
        console.log(`--- Lines ${start+1} to ${end+1} ---`);
        for (let j = start; j < end; j++) {
            console.log(`${j+1}: ${lines[j].trim()}`);
        }
    }
});
