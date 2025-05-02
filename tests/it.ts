import { it } from '@jest/globals';

type TestNameLike = Parameters<typeof it>[0];
type TestFn = Parameters<typeof it>[1];

export const createIt = () => {
  let i = 1;
  return (testName: TestNameLike, fn: TestFn, timeout?: number) =>
    it(`${String(i++).padStart(3, ' ')}. ${testName}`, fn, timeout);
};
