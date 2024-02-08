import { rmSync } from 'fs';
import pmex from 'pmex';

// Remove current build
rmSync('dist', {
  force: true,
  recursive: true,
});

pmex('parcel build');
