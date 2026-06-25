const fs = require('fs');
const path = require('path');

function fixFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');

    // Rule 3: Badges
    content = content.replace(/bg-\[#22C55E\]\/10 text-\[#005321\] border-\[#4ae176\]/g, 'bg-[#dcfce7] text-[#166534] border-[#dcfce7]');
    content = content.replace(/bg-\[#22C55E\]\/10 text-\[#005321\]/g, 'bg-[#dcfce7] text-[#166534]');
    
    // Status badges overrides based on Rule 8 mapping
    content = content.replace(/bg-orange-100 text-orange-800/g, 'bg-[#fff7ed] text-[#9a3412]');
    content = content.replace(/bg-red-100 text-red-800/g, 'bg-[#fee2e2] text-[#991b1b]');
    
    // Rule 3: Buttons and general elements
    content = content.replace(/bg-\[#22C55E\]/g, 'bg-[#006e2f]');
    content = content.replace(/hover:bg-\[#22C55E\]/g, 'hover:bg-[#005321]');
    
    // Text colors
    content = content.replace(/text-\[#22C55E\]/gi, 'text-[#006e2f]');
    
    // Borders and rings
    content = content.replace(/border-\[#22C55E\]/g, 'border-[#006e2f]');
    content = content.replace(/ring-\[#22C55E\]/g, 'ring-[#006e2f]');

    // Stroke/Fill for SVGs and charts
    content = content.replace(/stroke="#22C55E"/g, 'stroke="#006e2f"');
    content = content.replace(/stroke: '#22C55E'/g, "stroke: '#006e2f'");
    content = content.replace(/fill="#22C55E"/g, 'fill="#006e2f"');
    content = content.replace(/fill: '#22C55E'/g, "fill: '#006e2f'");
    content = content.replace(/stopColor="#22C55E"/g, 'stopColor="#006e2f"');

    // Replace error colors to match Rule 1 (Red -> #ba1a1a) where hardcoded
    content = content.replace(/text-red-700/g, 'text-[#ba1a1a]');

    fs.writeFileSync(filepath, content, 'utf8');
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            // Skip profile page as it has dark sections
            if (fullPath.includes('profile') && fullPath.endsWith('page.tsx')) {
                continue;
            }
            fixFile(fullPath);
        }
    }
}

const targetDirs = [
    path.join(__dirname, 'src', 'app', 'admin'),
    path.join(__dirname, 'src', 'app', 'dashboard')
];

for (const dir of targetDirs) {
    if (fs.existsSync(dir)) {
        walkDir(dir);
    }
}

console.log("Replacement complete for admin and dashboard files.");
