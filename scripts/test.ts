import pmex from 'pmex';
import { execSync } from 'child_process';

const args = process.argv.slice(2).join(' ');

pmex(`prettier "{scripts,src}/**/*.{js,jsx,ts,tsx}" --check`);

pmex(`tsc --noEmit`);

execSync(`jest ${args}`, { stdio: 'inherit' });
