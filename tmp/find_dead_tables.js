const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../src/types/database.ts'), 'utf8');

const tableRegex = /Tables:\s*\{([\s\S]*?)\}\s*Views:/;
const match = content.match(tableRegex);

if (!match) {
    console.error("Tables block not found");
    process.exit(1);
}

const lines = match[1].split('\n');
const tables = [];
for (const line of lines) {
    const m = line.match(/^ {6}([a-zA-Z0-9_]+): \{/);
    if (m) tables.push(m[1]);
}

function searchInDir(dir, word) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'types' && file !== 'node_modules') {
                if (searchInDir(fullPath, word)) return true;
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const text = fs.readFileSync(fullPath, 'utf8');
            if (text.includes(word)) return true;
        }
    }
    return false;
}

console.log("Total tables found:", tables.length);

const deadTables = [];
const usedTables = [];

for (const tbl of tables) {
    if (searchInDir(path.join(__dirname, '../src'), tbl)) {
        usedTables.push(tbl);
    } else {
        deadTables.push(tbl);
    }
}

console.log("\n[Dead Tables Candidates (Not Found in src/)]");
deadTables.forEach(t => console.log("- " + t));

// console.log("\n[Used Tables]");
// usedTables.forEach(t => console.log("- " + t));
