import { it as itJest, describe as describeJest } from '@jest/globals';

type TestNameLike = Parameters<typeof itJest>[0];
type TestFn = Parameters<typeof itJest>[1];

type BlockNameLike = Parameters<typeof describeJest>[0];
type BlockFn = Parameters<typeof describeJest>[1];

const createJest = () => {
  let _level = 0;
  let _currentCounter = 0;
  let _globalCounter = 0;
  const _index = [] as number[];

  const _p = (n: number) => `${String(n).padStart(3, ' ')}`;

  const describe = (blockName: BlockNameLike, blockFn: BlockFn) => {
    _level++;
    _index[_level - 1] = _index[_level - 1] === undefined ? 1 : _index[_level - 1] + 1;
    _currentCounter = 0;
    describeJest(`${_index.join('.')} ${blockName}`, blockFn);
    _currentCounter = 0;
    _level--;
  };

  const it = (testName: TestNameLike, fn: TestFn, timeout?: number) => {
    _currentCounter++;
    _globalCounter++;
    itJest(`${_p(_currentCounter)}. ${testName} (G-${_globalCounter})`, fn, timeout);
  };

  return {
    describe,
    it,
  };
};

export const { describe, it } = createJest();
