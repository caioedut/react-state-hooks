import pmex from 'pmex';

pmex(`prettier "{scripts,src}/**/*.{js,jsx,ts,tsx}" --check`);

pmex(`tsc --noEmit`);
