const { execSync } = require('child_process');
execSync('npx tsc src/lib/schemas/quoteSettings.ts --target es2019 --module commonjs --outDir .tmp', { stdio: 'inherit' });
execSync('node tests/quoteSettings.test.js', { stdio: 'inherit' });
