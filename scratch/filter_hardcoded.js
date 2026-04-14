
import fs from 'fs';

const audit = JSON.parse(fs.readFileSync('hardcoded_audit.json', 'utf8'));

const filtered = audit.filter(item => {
  const text = item.text;
  
  // 1. Skip if it's a comment
  if (text.trim().startsWith('//') || text.trim().startsWith('*') || text.trim().startsWith('/*')) return false;
  
  // 2. Skip if it's already in t() call (simple check)
  // We'll manage t() calls separately if needed, but for now focus on UN-localized
  const tCallRegex = /t\s*\(\s*['"][\w.]+['"]\s*,\s*['"]([^'"]+)['"]\s*/;
  if (tCallRegex.test(text)) return false;

  // 3. Skip common technical strings or console logs
  if (text.includes('console.log') || text.includes('console.error')) return false;
  
  return true;
});

fs.writeFileSync('hardcoded_to_extract.json', JSON.stringify(filtered, null, 2));
console.log(`Filtered to ${filtered.length} items truly needing extraction.`);
