const fs = require('fs');
const path = require('path');

const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const aiLanguageRegex = /\b(Seamlessly|Effortlessly|Cutting-edge|Revolutionize|Revolutionary|Empower|Unlock|Leverage|Robust|World-class|Game-changing|Journey|Supercharge|Elevate)\b/i;

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      callback(path.join(dir, f));
    }
  });
}

const issues = [];

walkDir('./src', (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (emojiRegex.test(line)) {
      issues.push(`EMOJI: ${filePath}:${index + 1}: ${line.trim()}`);
    }
    if (aiLanguageRegex.test(line)) {
      issues.push(`AILANG: ${filePath}:${index + 1}: ${line.trim()}`);
    }
    if (line.includes('<img')) {
      issues.push(`IMG: ${filePath}:${index + 1}: ${line.trim()}`);
    }
  });
});

fs.writeFileSync('issues.txt', issues.join('\n'));
console.log(`Found ${issues.length} issues.`);
