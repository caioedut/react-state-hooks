import pmex, { args } from 'pmex';
import { execSync } from 'child_process';

pmex(`prettier "{scripts,src}/**/*.{js,jsx,ts,tsx}" --check`);

pmex(`tsc --noEmit`);

execSync(`jest ${args().$}`, { stdio: 'inherit' });
