const fs = require('fs');
const path = require('path');

const localesDir = path.join(process.cwd(), 'src/locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const ko = JSON.parse(fs.readFileSync(path.join(localesDir, 'ko.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));

// Keys to sync
const blocks = [
  { path: ['study', 'voca'] },
  { path: ['voca', 'pos'] }
];

function getValue(obj, path) {
  let curr = obj;
  for (const key of path) {
    if (!curr || typeof curr !== 'object') return undefined;
    curr = curr[key];
  }
  return curr;
}

function setValue(obj, path, value) {
  let curr = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!curr[key]) curr[key] = {};
    curr = curr[key];
  }
  curr[path[path.length - 1]] = value;
}

files.forEach(file => {
  if (file === 'ko.json') return; // Skip ko.json as it's the source for structure

  const filePath = path.join(localesDir, file);
  const lang = file.split('.')[0];
  let content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let modified = false;

  blocks.forEach(block => {
    const koBlock = getValue(ko, block.path);
    if (!koBlock) return;

    // Recursively sync keys
    function sync(target, sourceKo, sourceEn, currentPath) {
      Object.keys(sourceKo).forEach(key => {
        const nextPath = [...currentPath, key];
        const valKo = sourceKo[key];
        const valEn = getValue(en, nextPath);
        const valTarget = target[key];

        if (typeof valKo === 'object' && valKo !== null) {
          if (!target[key] || typeof target[key] !== 'object') {
            target[key] = {};
            modified = true;
          }
          sync(target[key], valKo, valEn, nextPath);
        } else {
          // If key is missing in target, use English value as fallback
          if (valTarget === undefined) {
            target[key] = valEn !== undefined ? valEn : valKo;
            modified = true;
          }
        }
      });
    }

    let targetBlock = getValue(content, block.path);
    if (!targetBlock) {
      setValue(content, block.path, {});
      targetBlock = getValue(content, block.path);
      modified = true;
    }
    sync(targetBlock, koBlock, getValue(en, block.path), block.path);
  });

  if (modified || file === 'en.json') {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    console.log(`Synced ${file}`);
  }
});
