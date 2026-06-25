const fs = require('fs');
const path = require('path');

// Regex patterns to remove AI-sounding copy (case insensitive)
const aiCopyMap = [
  { pattern: /\bInstitutional-grade\b/gi, replacement: 'Professional' },
  { pattern: /\bLeverage\b/gi, replacement: 'Use' },
  { pattern: /\bleverage\b/gi, replacement: 'use' },
  { pattern: /\bUtilize\b/gi, replacement: 'Use' },
  { pattern: /\butilize\b/gi, replacement: 'use' },
  { pattern: /\bSeamlessly\s?/gi, replacement: '' },
  { pattern: /\bseamlessly\s?/gi, replacement: '' },
  { pattern: /\bCutting-edge\s?/gi, replacement: '' },
  { pattern: /\bcutting-edge\s?/gi, replacement: '' },
  { pattern: /\bRevolutionary\s?/gi, replacement: '' },
  { pattern: /\brevolutionary\s?/gi, replacement: '' },
  { pattern: /\bGame-changing\s?/gi, replacement: '' },
  { pattern: /\bgame-changing\s?/gi, replacement: '' },
  { pattern: /\bUnlock\b/gi, replacement: 'Access' },
  { pattern: /\bunlock\b/gi, replacement: 'access' },
  { pattern: /\bEmpower\b/gi, replacement: 'Enable' },
  { pattern: /\bempower\b/gi, replacement: 'enable' },
  { pattern: /\bEcosystem\b/gi, replacement: 'platform' },
  { pattern: /\becosystem\b/gi, replacement: 'platform' },
  { pattern: /\bSynergy\b/gi, replacement: 'collaboration' },
  { pattern: /\bsynergy\b/gi, replacement: 'collaboration' },
  { pattern: /\bBest-in-class\s?/gi, replacement: '' },
  { pattern: /\bbest-in-class\s?/gi, replacement: '' },
  { pattern: /\bWorld-class\s?/gi, replacement: '' },
  { pattern: /\bworld-class\s?/gi, replacement: '' },
  { pattern: /\bRobust\b/gi, replacement: 'Reliable' },
  { pattern: /\brobust\b/gi, replacement: 'reliable' },
  { pattern: /\bSupercharge\s?/gi, replacement: '' },
  { pattern: /\bsupercharge\s?/gi, replacement: '' },
  { pattern: /\bSkyrocket\s?/gi, replacement: '' },
  { pattern: /\bskyrocket\s?/gi, replacement: '' },
];

// Regex to match emojis (basic ranges)
const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu;

function fixFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    let original = content;

    // Apply AI copy replacements
    aiCopyMap.forEach(({ pattern, replacement }) => {
        content = content.replace(pattern, replacement);
    });

    // Specific replacements mentioned in prompt
    content = content.replace(/Now available across Kenya 🇰🇪/g, 'Now available across Kenya');
    content = content.replace(/Built with pride in Nairobi, Kenya 🇰🇪/g, 'Built in Nairobi, Kenya');
    content = content.replace(/Good morning, \{firstName\} 👋/g, 'Good morning, {firstName}');
    content = content.replace(/Good morning, (.*?) 👋/g, 'Good morning, $1');

    // Remove remaining emojis
    content = content.replace(emojiRegex, '');

    // Removed the whitespace squashing line to prevent syntax errors with inline comments

    // Only write if changed
    if (content !== original) {
        fs.writeFileSync(filepath, content, 'utf8');
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            fixFile(fullPath);
        }
    }
}

const targetDir = path.join(__dirname, 'src', 'app');
if (fs.existsSync(targetDir)) {
    walkDir(targetDir);
}

console.log("Copy and Emoji cleanup complete.");
