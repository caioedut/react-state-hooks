import { pmex, args } from 'pmex';
import { execSync } from 'child_process';

pmex('oxfmt --check');

pmex('oxlint .');

pmex('tsc --noEmit');

execSync(`vitest run ${args().$ ?? ''}`, { stdio: 'inherit' });
