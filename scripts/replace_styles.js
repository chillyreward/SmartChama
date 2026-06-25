const fs = require('fs');
const path = require('path');

const directories = [
  path.join(__dirname, '../src/app/admin'),
  path.join(__dirname, '../src/app/dashboard'),
  path.join(__dirname, '../src/components')
];

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace bg-page (body/layout wrappers)
  content = content.replace(/bg-\[\#FAFAFA\] dark:bg-\[\#0B0F0C\]/g, 'page-bg');
  content = content.replace(/bg-white dark:bg-\[\#0B0F0C\]/g, 'page-bg'); // Some layouts might use this
  
  // Replace bg-card
  content = content.replace(/bg-white dark:bg-\[\#161d16\]/g, 'card-bg');
  
  // Replace sidebar
  content = content.replace(/bg-white dark:bg-\[\#0f1410\]/g, 'sidebar-bg');
  
  // Replace inputs and small sub-cards
  content = content.replace(/bg-white dark:bg-\[\#1a2218\]/g, 'bg-transparent');
  content = content.replace(/bg-\[\#FAFAFA\] dark:bg-\[\#1a2218\]/g, 'bg-transparent');
  content = content.replace(/bg-\[\#FAFAFA\] dark:bg-\[\#131a13\]/g, 'bg-transparent');
  
  // Replace subtle green backgrounds (hover states, small tags)
  content = content.replace(/bg-\[\#edf6ea\] dark:bg-\[\#1a2a1a\]/g, 'bg-transparent text-[var(--brand-green)]');
  
  // Replace specific text colors with variables
  content = content.replace(/text-\[\#161d16\] dark:text-\[\#E8F0E4\]/g, 'text-[var(--text-main)]');
  content = content.replace(/text-\[\#60645f\] dark:text-\[\#8FA88F\]/g, 'text-[var(--text-muted)]');
  content = content.replace(/text-\[\#006e2f\] dark:text-\[\#4ae176\]/g, 'text-[var(--brand-green)]');
  
  // Replace borders
  content = content.replace(/border-\[\#E5E7EB\] dark:border-\[\#2d3d2d\]/g, 'border-[var(--border)]');
  content = content.replace(/border-\[\#E5E7EB\] dark:border-\[\#1a2a1a\]/g, 'border-[var(--border)]');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function traverseDir(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  });
}

directories.forEach(traverseDir);
console.log('Done!');
