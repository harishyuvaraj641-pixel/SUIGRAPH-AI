const fs = require('fs');
const path = require('path');

function copyStaticTo(targetDirName) {
  const targetDir = path.join(__dirname, targetDirName);
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });

  // Copy index.html
  fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(targetDir, 'index.html'));

  // Copy src directory
  fs.cpSync(path.join(__dirname, 'src'), path.join(targetDir, 'src'), { recursive: true });

  console.log(`Copied static files to ${targetDirName}/`);
}

copyStaticTo('public');
copyStaticTo('dist');
console.log('Build completed successfully.');
