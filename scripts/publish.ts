import pmex from 'pmex';
import { execSync } from 'child_process';

const args = process.argv.slice(2);

pmex('test');

pmex('build');

if (!args.includes('--no-version')) {
  pmex('npm version patch');
  execSync('git push', { stdio: 'inherit' });
}

pmex('npm publish', { stdio: 'inherit' });
