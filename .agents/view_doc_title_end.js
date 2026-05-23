const fs = require('fs');
const filepath = "c:\\Users\\d.ibatullin\\Yandex.Disk\\!Работа\\6. КАЛЬКУЛЯТОР\\Otoplenie_Calc\\Редакция\\stout & rommer\\app.js";

const content = fs.readFileSync(filepath, 'utf-8');
const lines = content.split('\n');

for (let j = 2700; j < 2725; j++) {
    console.log(`${j+1}: ${lines[j].trim()}`);
}
