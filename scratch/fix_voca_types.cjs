const fs = require('fs');
const path = require('path');

const localesDir = path.join(process.cwd(), 'src/locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const ko = JSON.parse(fs.readFileSync(path.join(localesDir, 'ko.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));

const TARGET_PATH = ['study', 'voca'];

function getValue(obj, pathArr) {
  let curr = obj;
  for (const key of pathArr) {
    if (!curr || typeof curr !== 'object') return undefined;
    curr = curr[key];
  }
  return curr;
}

function setValue(obj, pathArr, value) {
  let curr = obj;
  for (let i = 0; i < pathArr.length - 1; i++) {
    const key = pathArr[i];
    if (!curr[key]) curr[key] = {};
    curr = curr[key];
  }
  curr[pathArr[pathArr.length - 1]] = value;
}

files.forEach(file => {
  if (file === 'ko.json') return;

  const filePath = path.join(localesDir, file);
  let content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let modified = false;

  const koBlock = getValue(ko, TARGET_PATH);
  if (!koBlock) return;

  let targetBlock = getValue(content, TARGET_PATH);
  if (!targetBlock || typeof targetBlock !== 'object') {
    setValue(content, TARGET_PATH, {});
    targetBlock = getValue(content, TARGET_PATH);
    modified = true;
  }

  // 1. Fix types (Flatten arrays/objects to string)
  Object.keys(targetBlock).forEach(key => {
    if (key === 'delete_confirm') return;

    const val = targetBlock[key];
    if (Array.isArray(val)) {
      targetBlock[key] = val[0] || '';
      console.log(`[${file}] Flattened array for ${key}`);
      modified = true;
    } else if (typeof val === 'object' && val !== null) {
      // This case might happen if i18next somehow nested things
      // We'll just reset it or take its first value if it looks like an object-based array
      targetBlock[key] = ''; // Safe default, will be synced later
      console.log(`[${file}] Reset object for ${key}`);
      modified = true;
    }
  });

  // 2. Sync and supplement from ko.json / en.json
  function sync(target, sourceKo, sourceEn, currentPath) {
    Object.keys(sourceKo).forEach(key => {
      const nextPath = [...currentPath, key];
      const valKo = sourceKo[key];
      const valEn = getValue(en, nextPath);
      const valTarget = target[key];

      if (key === 'delete_confirm') {
         if (!target[key] || typeof target[key] !== 'object') {
             target[key] = {};
             modified = true;
         }
         sync(target[key], valKo, valEn, nextPath);
         return;
      }

      if (valTarget === undefined || valTarget === '' || Array.isArray(valTarget) || (typeof valTarget === 'object' && valTarget !== null)) {
        // If missing or still not a string
        let fallback = valEn !== undefined ? valEn : valKo;
        // Ensure fallback is string if it's not delete_confirm
        if (Array.isArray(fallback)) fallback = fallback[0] || '';
        
        target[key] = fallback;
        modified = true;
        console.log(`[${file}] Fixed/Synced ${nextPath.join('.')}`);
      }
    });
  }

  sync(targetBlock, koBlock, getValue(en, TARGET_PATH), TARGET_PATH);

  // Always sort keys for consistency
  const sortedBlock = {};
  Object.keys(koBlock).sort().forEach(k => {
    if (targetBlock[k] !== undefined) sortedBlock[k] = targetBlock[k];
  });
  // Put sorted block back
  setValue(content, TARGET_PATH, sortedBlock);

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  if (modified) console.log(`Done fixing ${file}`);
});
