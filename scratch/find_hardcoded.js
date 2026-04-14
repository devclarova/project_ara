
import fs from 'fs';
import path from 'path';

const srcDir = './src';
const excludedDirs = ['locales', 'admin'];

function findKoreanInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const results = [];

  lines.forEach((line, index) => {
    // Remove comments (simple check)
    const cleanLine = line.replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Regex for Korean characters
    const koreanRegex = /[가-힣]/;
    if (koreanRegex.test(cleanLine)) {
      // Exclude strings that look like they are already in localized keys (dynamic keys)
      // and exclude console logs or specific common patterns if needed.
      results.push({
        line: index + 1,
        text: line.trim()
      });
    }
  });

  return results;
}

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    
    if (isDirectory) {
      if (!excludedDirs.includes(f)) {
        walkDir(dirPath, callback);
      }
    } else {
      if (f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.jsx') || f.endsWith('.js')) {
        callback(dirPath);
      }
    }
  });
}

const hardcodedStrings = [];

walkDir(srcDir, (filePath) => {
  const findings = findKoreanInFile(filePath);
  if (findings.length > 0) {
    hardcodedStrings.push({
      file: filePath,
      findings
    });
  }
});

fs.writeFileSync('hardcoded_korean.json', JSON.stringify(hardcodedStrings, null, 2));
console.log(`Found ${hardcodedStrings.length} files with potential hardcoded Korean.`);
