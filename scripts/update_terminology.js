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

  // Replacements
  content = content.replace(/Wallet Balance/g, 'Recorded Contributions');
  content = content.replace(/GROUP WALLET BALANCE/g, 'TOTAL RECORDED');
  content = content.replace(/Group Wallet/g, 'Total Recorded');
  content = content.replace(/group wallet/g, 'total recorded');
  content = content.replace(/Available Balance/g, 'Tracked Pool');
  content = content.replace(/Your Balance/g, 'Your Contributions');
  content = content.replace(/in wallet/g, 'recorded');
  content = content.replace(/IN WALLET/g, 'RECORDED');

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
console.log('Terminology updated!');
