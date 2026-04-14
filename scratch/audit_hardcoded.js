
import fs from 'fs';
import path from 'path';

const srcDir = './src';
const excludedDirs = ['locales', 'admin', 'tests'];

const results = [];

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!excludedDirs.includes(file)) {
        walkDir(filePath);
      }
    } else if (file.match(/\.(tsx|ts|jsx|js)$/)) {
      analyzeFile(filePath);
    }
  }
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // 1. Check for JSX Text: >...한국어...<
    const jsxMatch = line.match(/>([^<]*[가-힣]+[^<]*)<|'([가-힣\s!?.~]+)'|"([가-힣\s!?.~]+)"|`([^`]*[가-힣]+[^`]*)`/);
    
    // Skip if it's already a localized string (e.g., t('...', 'default'))
    // But we might want to check if 'default' itself is consistent with ko.json
    
    // 2. Logic Alert: Check for comparisons
    const logicMatch = line.match(/(===|!==|==|!=)\s*['"`]([가-힣]+)['"`]|['"`]([가-힣]+)['"`]\s*(===|!==|==|!=)/);
    
    if (jsxMatch || logicMatch) {
      // Exclude comments
      const cleanLine = line.replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//g, '');
      if (/[가-힣]/.test(cleanLine)) {
        results.push({
          file: filePath,
          line: index + 1,
          text: line.trim(),
          isLogicPotential: !!logicMatch
        });
      }
    }
  });
}

walkDir(srcDir);
fs.writeFileSync('hardcoded_audit.json', JSON.stringify(results, null, 2));
console.log(`Audit complete. Found ${results.length} potential hardcoded Korean strings.`);
