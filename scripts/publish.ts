import pmex, { args } from 'pmex';
import { execSync } from 'child_process';

pmex('test');

pmex('build');

if (!args()['no-version']) {
  pmex('npm version patch');
  execSync('git push', { stdio: 'inherit' });
}

pmex('npm publish', { stdio: 'inherit' });
