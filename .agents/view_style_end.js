const fs = require('fs');
const filepath = "c:\\Users\\d.ibatullin\\Yandex.Disk\\!Работа\\6. КАЛЬКУЛЯТОР\\Otoplenie_Calc\\Редакция\\stout & rommer\\style.css";

const content = fs.readFileSync(filepath, 'utf-8');
const lines = content.split('\n');
const start = Math.max(0, lines.length - 50);

for (let j = start; j < lines.length; j++) {
    console.log(`${j+1}: ${lines[j].trim()}`);
}
