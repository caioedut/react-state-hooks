import pmex from 'pmex';
import { execSync } from 'child_process';
import { copyFileSync } from 'fs';

pmex('test');

pmex('build');

pmex('npm version patch');

copyFileSync('package.json', 'dist/package.json');
copyFileSync('README.md', 'dist/README.md');

execSync('npm publish', { stdio: 'inherit', cwd: './dist' });

execSync('git push', { stdio: 'inherit' });
