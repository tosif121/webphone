const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../package.json');

const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const parts = packageData.version.split('.');
parts[2] = String(parseInt(parts[2], 10) + 1);
packageData.version = parts.join('.');

fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2) + '\n');

console.log(`Build version: ${packageData.version}`);
