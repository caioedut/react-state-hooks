import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library only wires these up itself when the test globals exist,
// and the tests import everything from `vitest` explicitly instead.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  cleanup();
});
