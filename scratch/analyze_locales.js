
import fs from 'fs';
import path from 'path';

const localesDir = './src/locales';
const masterFile = 'ko.json';

const masterPath = path.join(localesDir, masterFile);
const masterData = JSON.parse(fs.readFileSync(masterPath, 'utf8'));

const getKeys = (obj, prefix = '') => {
  return Object.keys(obj).reduce((res, el) => {
    if (Array.isArray(obj[el])) {
      return res;
    } else if (typeof obj[el] === 'object' && obj[el] !== null) {
      return [...res, ...getKeys(obj[el], prefix + el + '.')];
    }
    return [...res, prefix + el];
  }, []);
};

const masterKeys = getKeys(masterData);
console.log(`Master (ko.json) contains ${masterKeys.length} keys.`);

const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json') && f !== masterFile && !f.includes('tmp') && !f.includes('block'));

const analysis = files.map(file => {
  const data = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8'));
  const keys = getKeys(data);
  const missing = masterKeys.filter(k => !keys.includes(k));
  return {
    file,
    totalKeys: keys.length,
    missingCount: missing.length,
    missingKeys: missing
  };
});

console.log('--- Localization Gap Analysis ---');
analysis.forEach(a => {
  console.log(`${a.file}: ${a.totalKeys} keys present, ${a.missingCount} keys missing (${Math.round(a.missingCount / masterKeys.length * 100)}% missing)`);
});

fs.writeFileSync('locales_analysis.json', JSON.stringify(analysis, null, 2));
