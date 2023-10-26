import { rmSync, copyFileSync } from 'fs';
import pmex from 'pmex';

// Remove current build
rmSync('dist', {
  force: true,
  recursive: true,
});

pmex('tsc --build --force');

copyFileSync('package.json', 'dist/package.json');
